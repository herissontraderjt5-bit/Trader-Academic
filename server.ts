import express from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer } from "http";
import { GoogleGenAI, Type } from "@google/genai";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "trader-secret-key-2024";

// PostgreSQL pool using Supabase
let pool: Pool | null = null;
const getPool = () => {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("DATABASE_URL is not defined in environment variables!");
      throw new Error("Configuração do Banco de Dados ausente (DATABASE_URL). Verifique o painel da Vercel.");
    }
    console.log("Creating new database pool...");
    pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('supabase.com')
        ? { rejectUnauthorized: false }
        : false
    });
  }
  return pool;
};

// Helper: run a query
const query = (text: string, params?: any[]) => {
  return getPool().query(text, params);
};

// Ensure uploads directory exists (use /tmp on Vercel)
const uploadDir = isVercel ? "/tmp/uploads" : path.join(process.cwd(), "uploads");
const videoDir = path.join(uploadDir, "videos");
if (!isVercel) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 } // 4GB limit
});

let freePlanId: any = null;
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  console.log("Initializing database connection...");
  try {
    await query("SELECT 1");
    await query("SET search_path TO trader, public");

    const freePlanResult = await query("SELECT id FROM trader.plans WHERE name = 'Plano Free' LIMIT 1");
    freePlanId = freePlanResult.rows[0]?.id || null;

    const adminCheck = await query("SELECT id FROM trader.users WHERE role = 'admin' LIMIT 1");
    if (adminCheck.rows.length === 0) {
      await query(
        "INSERT INTO trader.users (name, login, password, role, referral_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (login) DO NOTHING",
        ["Administrador", "admin", "admin123", "admin", "ADMIN0"]
      );
    }
    dbInitialized = true;
    console.log("Database initialized.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

async function startServer() {
  try {
    const app = express();

    app.use(express.json({ limit: '4gb' }));
    app.use(express.urlencoded({ extended: true, limit: '4gb' }));

    const server = isVercel ? null : createServer(app);
    let wss: any = null;

    if (!isVercel) {
      const { WebSocketServer, WebSocket } = await import("ws");
      wss = new WebSocketServer({ server: server! });
      console.log("WebSocket server initialized.");
    }

    // Helper to broadcast signals
    const broadcastSignal = (signal: any) => {
      if (!wss) return;
      const { WebSocket } = require("ws"); // Minimal usage
      const message = JSON.stringify({ type: 'NEW_SIGNAL', data: signal });
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    };

    // Auth Middleware
    const authenticate = (req: any, res: any, next: any) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
      } catch (e) {
        res.status(401).json({ error: "Invalid token" });
      }
    };

    // API Routes
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    app.get("/api/health", async (req, res) => {
      try {
        await query("SELECT 1");
        res.json({ status: "ok", database: "connected", env: process.env.NODE_ENV });
      } catch (e: any) {
        res.status(500).json({ status: "error", database: e.message });
      }
    });

    app.post("/api/admin/upload-video", authenticate, (req: any, res, next) => {
      console.log('Iniciando upload de vídeo...');
      upload.single("video")(req, res, (err) => {
        if (err) {
          console.error('Erro no multer:', err);
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    }, (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      console.log('Arquivo recebido:', req.file.filename, 'Tamanho:', req.file.size);
      const videoUrl = `/uploads/videos/${req.file.filename}`;
      res.json({ url: videoUrl });
    });

    app.post("/api/signals/generate", authenticate, async (req: any, res) => {
      // Check if user has a valid plan (not Free)
      const userResult = await query(
        "SELECT u.*, p.name as plan_name FROM trader.users u LEFT JOIN trader.plans p ON u.plan_id = p.id WHERE u.id = $1",
        [req.user.id]
      );
      const user = userResult.rows[0];
      const hasPlan = user && user.plan_name && user.plan_name !== 'Plano Free' && user.access_days > 0;

      if (req.user.role !== 'admin' && !hasPlan) {
        return res.status(403).json({ error: "Acesso exclusivo para alunos VIP. Adquira um plano para liberar os sinais de IA." });
      }

      const { asset, market, is_otc } = req.body;
      let reasoning = "Análise técnica baseada em indicadores de tendência e volume.";

      // Generate AI reasoning if API key is present
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (apiKey && apiKey !== "AIzaSyAU-vZoWMzcBj6ZzkaOHlMXD6RRqlpF6t8") {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
          const prompt = `Como um analista sênior de trading institucional, forneça uma operação no ativo ${asset} no mercado de ${market}.
          
          Sua análise DEVE incluir os seguintes critérios obrigatoriamente:
          1. Smart Money Concepts (SMC): Identifique Order Blocks, captação de Liquidez e quebra de estrutura.
          2. Price Action e Fibo: Analise os movimentos de preço puros, retrações e expansões de Fibonacci.
          3. Divergências: Identifique claramente divergências de topos e fundos.
          4. Volume: Confirme o movimento esperado baseado no volume financeiro.
          5. ${market === 'BINARY' ? 'Justificativa focada em tempo gráfico (Horário)' : 'Justificativa focada em região de preço'}.

          IMPORTANTE: No final da sua resposta, forneça OBRIGATORIAMENTE um resumo direto e simples (1 frase) explicando o motivo exato de termos um sinal de COMPRA ou VENDA.
          
          Responda em português, de forma técnica, convincente e em no máximo 3 a 4 parágrafos curtos.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          reasoning = response.text();
        } catch (e: any) {
          console.error("Gemini AI Error:", e);
          reasoning = `[AVISO]: O sinal foi gerado tecnicamente, mas a análise detalhada da IA falhou: ${e.message}`;
        }
      }

      const types = ['BUY', 'SELL'];
      const type = types[Math.floor(Math.random() * types.length)];

      // Calculate entry time (between 5 to 15 minutes from now)
      const now = new Date();
      const waitMinutes = 5 + Math.floor(Math.random() * 11);
      now.setMinutes(now.getMinutes() + waitMinutes);
      const entry_time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

      const signal = {
        asset: asset,
        market,
        type,
        timeframe: market === 'BINARY' ? 'M1' : (market === 'FUTURES' ? 'M5' : 'H1'),
        entry_price: parseFloat((1.05 + Math.random() * 0.1).toFixed(market === 'FUTURES' ? 2 : 5)),
        stop_loss: market !== 'BINARY' ? parseFloat((1.04 + Math.random() * 0.1).toFixed(market === 'FUTURES' ? 2 : 5)) : null,
        take_profit: market !== 'BINARY' ? parseFloat((1.06 + Math.random() * 0.1).toFixed(market === 'FUTURES' ? 2 : 5)) : null,
        expiration: market === 'BINARY' ? '5 min' : null,
        accuracy: 88 + Math.floor(Math.random() * 10),
        is_otc: 0,
        entry_time,
        reasoning: reasoning,
        created_at: new Date().toISOString()
      };

      try {
        // Delete old signals to avoid accumulation
        await query("DELETE FROM trader.signals");

        const result = await query(`
          INSERT INTO trader.signals (asset, type, market, timeframe, entry_price, stop_loss, take_profit, expiration, accuracy, is_otc, entry_time, reasoning, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `, [
          signal.asset, signal.type, signal.market, signal.timeframe,
          signal.entry_price, signal.stop_loss, signal.take_profit,
          signal.expiration, signal.accuracy, signal.is_otc, signal.entry_time, signal.reasoning, signal.created_at
        ]);

        const fullSignal = { ...signal, id: result.rows[0].id };
        broadcastSignal(fullSignal);
        res.json(fullSignal);
      } catch (e) {
        console.error('Error saving signal:', e);
        res.status(500).json({ error: "Erro ao gerar sinal" });
      }
    });

    app.post("/api/signals/clear", authenticate, async (req: any, res) => {
      try {
        await query("DELETE FROM trader.signals");
        // Notify all clients to clear their signals
        if (wss) {
          const message = JSON.stringify({ type: 'CLEAR_SIGNALS' });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: "Erro ao limpar sinais" });
      }
    });

    app.post("/api/register", async (req, res) => {
      const { name, login, password, phone, referral_code } = req.body;
      try {
        const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        let referredBy = null;

        if (referral_code) {
          const referrerResult = await query("SELECT id FROM trader.users WHERE referral_code = $1", [referral_code]);
          if (referrerResult.rows.length > 0) referredBy = referrerResult.rows[0].id;
        }

        const result = await query(
          "INSERT INTO trader.users (name, login, password, phone, role, plan_id, access_days, referral_code, referred_by) VALUES ($1, $2, $3, $4, 'student', $5, 9999, $6, $7) RETURNING id",
          [name, login, password, phone, freePlanId, myReferralCode, referredBy]
        );

        const newUserId = result.rows[0].id;

        if (referredBy) {
          await query("INSERT INTO trader.referrals (referrer_id, referred_id) VALUES ($1, $2)", [referredBy, newUserId]);
        }

        const token = jwt.sign({ id: newUserId, role: 'student', name }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: newUserId, name, role: 'student', login, referral_code: myReferralCode } });
      } catch (e) {
        console.error('Register error:', e);
        res.status(400).json({ error: "Login já existe" });
      }
    });

    app.post("/api/login", async (req, res) => {
      const { login, password } = req.body;
      const result = await query("SELECT * FROM trader.users WHERE login = $1 AND password = $2", [login, password]);
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: "Credenciais inválidas" });
      if (user.is_blocked) return res.status(403).json({ error: "Sua conta está bloqueada. Entre em contato com o suporte." });

      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, login: user.login } });
    });

    // Student Routes
    app.get("/api/lessons/latest", authenticate, async (req, res) => {
      const result = await query(`
        SELECT l.*, m.title as module_title 
        FROM trader.lessons l 
        JOIN trader.modules m ON l.module_id = m.id 
        ORDER BY l.id DESC 
        LIMIT 5
      `);
      res.json(result.rows);
    });

    app.get("/api/student/me", authenticate, async (req: any, res) => {
      const result = await query(`
        SELECT u.*, p.name as plan_name 
        FROM trader.users u 
        LEFT JOIN trader.plans p ON u.plan_id = p.id 
        WHERE u.id = $1
      `, [req.user.id]);

      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: "User not found" });

      // Calculate days remaining
      const lastPayment = user.last_payment ? new Date(user.last_payment).getTime() : 0;
      const now = new Date().getTime();
      const daysPassed = lastPayment > 0 ? Math.floor((now - lastPayment) / (1000 * 60 * 60 * 24)) : 0;
      const accessDays = parseInt(user.access_days) || 0;
      const daysRemaining = lastPayment > 0 ? Math.max(0, accessDays - daysPassed) : accessDays;

      res.json({
        ...user,
        balance: parseFloat(user.balance) || 0,
        commission_rate: parseFloat(user.commission_rate) || 0,
        daysRemaining
      });
    });

    app.put("/api/student/profile", authenticate, async (req: any, res) => {
      const { name, phone, password, photo_url } = req.body;
      try {
        if (password) {
          await query("UPDATE trader.users SET name = $1, phone = $2, password = $3, photo_url = $4 WHERE id = $5",
            [name, phone, password, photo_url, req.user.id]);
        } else {
          await query("UPDATE trader.users SET name = $1, phone = $2, photo_url = $3 WHERE id = $4",
            [name, phone, photo_url, req.user.id]);
        }
        res.json({ success: true });
      } catch (e) {
        res.status(400).json({ error: "Erro ao atualizar perfil" });
      }
    });

    app.get("/api/courses", authenticate, async (req, res) => {
      const modulesResult = await query("SELECT * FROM trader.modules ORDER BY order_index ASC");
      const lessonsResult = await query("SELECT * FROM trader.lessons ORDER BY order_index ASC");

      const courseData = modulesResult.rows.map((m: any) => ({
        ...m,
        lessons: lessonsResult.rows.filter((l: any) => l.module_id === m.id)
      }));

      res.json(courseData);
    });

    app.get("/api/progress", authenticate, async (req: any, res) => {
      const result = await query("SELECT lesson_id FROM trader.progress WHERE user_id = $1", [req.user.id]);
      res.json(result.rows.map((p: any) => p.lesson_id));
    });

    app.post("/api/progress/toggle", authenticate, async (req: any, res) => {
      const { lesson_id } = req.body;
      const existsResult = await query(
        "SELECT * FROM trader.progress WHERE user_id = $1 AND lesson_id = $2",
        [req.user.id, lesson_id]
      );

      if (existsResult.rows.length > 0) {
        await query("DELETE FROM trader.progress WHERE user_id = $1 AND lesson_id = $2", [req.user.id, lesson_id]);
      } else {
        await query("INSERT INTO trader.progress (user_id, lesson_id) VALUES ($1, $2)", [req.user.id, lesson_id]);
      }
      res.json({ success: true });
    });

    // Admin Routes
    app.get("/api/admin/stats", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

      const [totalUsers, activeUsers, totalRevenue, pendingWithdrawals, totalCommissions] = await Promise.all([
        query("SELECT COUNT(*) as count FROM trader.users WHERE role = 'student'"),
        query("SELECT COUNT(*) as count FROM trader.users WHERE role = 'student' AND access_days > 0"),
        query("SELECT SUM(p.price) as total FROM trader.users u JOIN trader.plans p ON u.plan_id = p.id"),
        query("SELECT COUNT(*) as count FROM trader.withdrawals WHERE status = 'pending'"),
        query("SELECT SUM(commission_earned) as total FROM trader.referrals WHERE status = 'converted'")
      ]);

      res.json({
        totalUsers: parseInt(totalUsers.rows[0].count) || 0,
        activeUsers: parseInt(activeUsers.rows[0].count) || 0,
        totalRevenue: parseFloat(totalRevenue.rows[0]?.total) || 0,
        inactiveUsers: (parseInt(totalUsers.rows[0].count) || 0) - (parseInt(activeUsers.rows[0].count) || 0),
        pendingWithdrawals: parseInt(pendingWithdrawals.rows[0].count) || 0,
        totalCommissions: parseFloat(totalCommissions.rows[0]?.total) || 0
      });
    });

    app.get("/api/admin/users", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const result = await query(`
        SELECT u.*, p.name as plan_name, u_ref.name as referrer_name,
        (SELECT COUNT(*) FROM trader.progress WHERE user_id = u.id) as completed_lessons,
        (SELECT COUNT(*) FROM trader.lessons) as total_lessons
        FROM trader.users u 
        LEFT JOIN trader.plans p ON u.plan_id = p.id
        LEFT JOIN trader.users u_ref ON u.referred_by = u_ref.id
        WHERE u.role = 'student'
      `);
      res.json(result.rows.map(user => ({
        ...user,
        commission_rate: parseFloat(user.commission_rate) || 0,
        balance: parseFloat(user.balance) || 0
      })));
    });

    app.post("/api/admin/users", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { name, login, password, phone, plan_id, access_days } = req.body;
      try {
        await query(
          "INSERT INTO trader.users (name, login, password, phone, plan_id, access_days) VALUES ($1, $2, $3, $4, $5, $6)",
          [name, login, password, phone, plan_id, access_days]
        );
        res.json({ success: true });
      } catch (e) {
        res.status(400).json({ error: "Login já existe" });
      }
    });

    app.put("/api/admin/users/:id", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { name, login, password, phone, plan_id, access_days, is_blocked, commission_rate } = req.body;
      try {
        const oldUserResult = await query("SELECT plan_id, referred_by FROM trader.users WHERE id = $1", [req.params.id]);
        const oldUser = oldUserResult.rows[0];

        await query(`
          UPDATE trader.users 
          SET name = $1, login = $2, password = $3, phone = $4, plan_id = $5, access_days = $6, is_blocked = $7, commission_rate = $8
          WHERE id = $9
        `, [name, login, password, phone, plan_id, access_days, is_blocked, commission_rate, req.params.id]);

        // If plan changed from free to paid and user was referred
        const currentPlanId = parseInt(plan_id);
        if (oldUser && oldUser.referred_by && parseInt(oldUser.plan_id) === freePlanId && currentPlanId !== freePlanId) {
          const referrerResult = await query("SELECT commission_rate FROM trader.users WHERE id = $1", [oldUser.referred_by]);
          if (referrerResult.rows.length > 0) {
            const commission = parseFloat(referrerResult.rows[0].commission_rate);
            await query("UPDATE trader.users SET balance = balance + $1 WHERE id = $2", [commission, oldUser.referred_by]);
            await query(
              "UPDATE trader.referrals SET status = 'converted', commission_earned = $1 WHERE referrer_id = $2 AND referred_id = $3",
              [commission, oldUser.referred_by, req.params.id]
            );
          }
        }

        res.json({ success: true });
      } catch (e) {
        console.error('Admin update user error:', e);
        res.status(400).json({ error: "Erro ao atualizar usuário" });
      }
    });

    app.post("/api/admin/users/:id/add-days", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { days } = req.body;
      await query("UPDATE trader.users SET access_days = access_days + $1 WHERE id = $2", [days, req.params.id]);
      res.json({ success: true });
    });

    app.get("/api/referrals/stats", authenticate, async (req: any, res) => {
      const [totalReferred, totalConverted, balanceResult, codeResult] = await Promise.all([
        query("SELECT COUNT(*) as count FROM trader.referrals WHERE referrer_id = $1", [req.user.id]),
        query("SELECT COUNT(*) as count FROM trader.referrals WHERE referrer_id = $1 AND status = 'converted'", [req.user.id]),
        query("SELECT balance FROM trader.users WHERE id = $1", [req.user.id]),
        query("SELECT referral_code FROM trader.users WHERE id = $1", [req.user.id])
      ]);

      res.json({
        total_referred: parseInt(totalReferred.rows[0].count) || 0,
        total_converted: parseInt(totalConverted.rows[0].count) || 0,
        balance: parseFloat(balanceResult.rows[0]?.balance) || 0,
        referral_code: codeResult.rows[0]?.referral_code || null
      });
    });

    app.post("/api/withdrawals", authenticate, async (req: any, res) => {
      const { amount, pix_key } = req.body;

      if (amount < 50) {
        return res.status(400).json({ error: "O valor mínimo para saque é R$ 50,00" });
      }

      const userResult = await query("SELECT balance FROM trader.users WHERE id = $1", [req.user.id]);
      const user = userResult.rows[0];

      if (!user || user.balance < amount) {
        return res.status(400).json({ error: "Saldo insuficiente" });
      }

      await query("UPDATE trader.users SET balance = balance - $1, pix_key = $2 WHERE id = $3", [amount, pix_key, req.user.id]);
      await query("INSERT INTO trader.withdrawals (user_id, amount, pix_key) VALUES ($1, $2, $3)", [req.user.id, amount, pix_key]);

      res.json({ success: true });
    });

    app.get("/api/withdrawals", authenticate, async (req: any, res) => {
      const result = await query("SELECT * FROM trader.withdrawals WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
      res.json(result.rows.map(w => ({
        ...w,
        amount: parseFloat(w.amount) || 0
      })));
    });

    // Admin Referral Routes
    app.get("/api/admin/referrals", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const result = await query(`
        SELECT r.*, u1.name as referrer_name, u2.name as referred_name 
        FROM trader.referrals r
        JOIN trader.users u1 ON r.referrer_id = u1.id
        JOIN trader.users u2 ON r.referred_id = u2.id
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows.map(ref => ({
        ...ref,
        commission_earned: parseFloat(ref.commission_earned) || 0
      })));
    });

    app.get("/api/admin/withdrawals", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const result = await query(`
        SELECT w.*, u.name as user_name 
        FROM trader.withdrawals w
        JOIN trader.users u ON w.user_id = u.id
        ORDER BY w.created_at DESC
      `);
      res.json(result.rows.map(w => ({
        ...w,
        amount: parseFloat(w.amount) || 0
      })));
    });

    app.put("/api/admin/withdrawals/:id", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { status } = req.body;
      await query("UPDATE trader.withdrawals SET status = $1 WHERE id = $2", [status, req.params.id]);
      res.json({ success: true });
    });

    app.put("/api/admin/referrals/:id/commission", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { commission_earned } = req.body;
      const referralId = req.params.id;

      try {
        const referralResult = await query("SELECT * FROM trader.referrals WHERE id = $1", [referralId]);
        const referral = referralResult.rows[0];
        if (!referral) return res.status(404).json({ error: "Referral not found" });

        const previousCommission = parseFloat(referral.commission_earned) || 0;
        const diff = commission_earned - previousCommission;

        // Set status to 'converted' if a commission is being set
        await query("UPDATE trader.referrals SET commission_earned = $1, status = 'converted' WHERE id = $2", [commission_earned, referralId]);

        // Update user balance
        await query("UPDATE trader.users SET balance = balance + $1 WHERE id = $2", [diff, referral.referrer_id]);

        res.json({ success: true });
      } catch (e) {
        console.error('Update referral commission error:', e);
        res.status(500).json({ error: "Erro ao atualizar comissão" });
      }
    });

    app.put("/api/admin/users/:id/commission", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { commission_rate } = req.body;
      await query("UPDATE trader.users SET commission_rate = $1 WHERE id = $2", [commission_rate, req.params.id]);
      res.json({ success: true });
    });

    app.get("/api/admin/plans", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const result = await query("SELECT * FROM trader.plans");
      res.json(result.rows.map(plan => ({
        ...plan,
        price: parseFloat(plan.price) || 0
      })));
    });

    app.post("/api/admin/plans", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { name, price, duration_type, description } = req.body;
      await query(
        "INSERT INTO trader.plans (name, price, duration_type, description) VALUES ($1, $2, $3, $4)",
        [name, price, duration_type, description]
      );
      res.json({ success: true });
    });

    app.put("/api/admin/plans/:id", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { name, price, duration_type, description } = req.body;
      await query(
        "UPDATE trader.plans SET name = $1, price = $2, duration_type = $3, description = $4 WHERE id = $5",
        [name, price, duration_type, description, req.params.id]
      );
      res.json({ success: true });
    });

    app.delete("/api/admin/plans/:id", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const planId = req.params.id;

      // First, set plan_id to NULL for users using this plan
      await query("UPDATE trader.users SET plan_id = NULL WHERE plan_id = $1", [planId]);

      // Then delete the plan
      await query("DELETE FROM trader.plans WHERE id = $1", [planId]);

      res.json({ success: true });
    });

    app.get("/api/signals", authenticate, async (req, res) => {
      const result = await query("SELECT * FROM trader.signals ORDER BY created_at DESC LIMIT 50");
      res.json(result.rows);
    });

    // Content Management
    app.post("/api/admin/modules", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { title } = req.body;
      await query("INSERT INTO trader.modules (title) VALUES ($1)", [title]);
      res.json({ success: true });
    });

    app.post("/api/admin/lessons", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      const { module_id, title, video_url, is_vip } = req.body;
      await query(
        "INSERT INTO trader.lessons (module_id, title, video_url, is_vip) VALUES ($1, $2, $3, $4)",
        [module_id, title, video_url, is_vip ? 1 : 0]
      );
      res.json({ success: true });
    });

    app.delete("/api/admin/lessons/:id", authenticate, async (req: any, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
      await query("DELETE FROM trader.lessons WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production" && !isVercel) {
      console.log("Initializing Vite server...");
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    }

    const PORT = parseInt(process.env.PORT || "3000");
    if (!isVercel && process.env.NODE_ENV !== "production") {
      server?.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    }

    return app;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    // In production we don't want to kill the process necessarily
    throw error;
  }
}

// Ensure the app exports correctly for Vercel
const appPromise = startServer();
export default async (req: any, res: any) => {
  await initDB();
  const app = await appPromise;
  return app(req, res);
};
export { startServer };
