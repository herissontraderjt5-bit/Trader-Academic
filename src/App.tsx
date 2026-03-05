/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  LogOut,
  Play,
  CheckCircle,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Menu,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  Brain,
  ShieldCheck,
  Video,
  Lock,
  Upload,
  Loader2,
  Calendar,
  Wallet,
  Share2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    TradingView: any;
  }
}

const tvSymbolMap: Record<string, string> = {
  'EUR/USD': 'FX:EURUSD',
  'GBP/USD': 'FX:GBPUSD',
  'USD/JPY': 'FX:USDJPY',
  'AUD/USD': 'FX:AUDUSD',
  'BTC/USD': 'BITSTAMP:BTCUSD',
  'ETH/USD': 'BITSTAMP:ETHUSD',
  'SOL/USD': 'BINANCE:SOLUSD',
  'BNB/USD': 'BINANCE:BNBUSD',
  'XRP/USD': 'BINANCE:XRPUSD',
  'GOLD': 'OANDA:XAUUSD',
  'SILVER': 'OANDA:XAGUSD',
  'OIL': 'TVC:USOIL',
  'NATGAS': 'TVC:NATGAS',
  'COPPER': 'COMEX:HG1!',
  'WINJ26': 'BMF:WIN1!',
  'WDOJ26': 'BMF:WDO1!',
  'MINI INDICE': 'BMF:WIN1!',
  'MINI DOLAR': 'BMF:WDO1!'
};

const TradingViewChart = ({ symbol, market }: { symbol: string, market: string }) => {
  const containerId = React.useMemo(() => `tv-chart-${Math.random().toString(36).substr(2, 9)}`, [symbol]);
  const tvSymbol = tvSymbolMap[symbol.replace('-OTC', '')] || symbol.replace('-OTC', '').replace('/', '');

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (window.TradingView && document.getElementById(containerId)) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": tvSymbol,
          "interval": "5",
          "timezone": "America/Sao_Paulo",
          "theme": "dark",
          "style": "1",
          "locale": "br",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_top_toolbar": true,
          "hide_legend": true,
          "save_image": false,
          "container_id": containerId,
          "backgroundColor": "rgba(10, 10, 10, 1)",
          "gridColor": "rgba(40, 40, 40, 0.5)"
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      if (window.TradingView) {
        initWidget();
      } else {
        script.addEventListener('load', initWidget);
      }
    }

    return () => {
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = '';
    };
  }, [tvSymbol, containerId]);

  return (
    <div className="relative group">
      <div
        id={containerId}
        className="w-full h-40 sm:h-48 lg:h-56 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 mb-4"
      />
      <div className="absolute top-2 right-2 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg">
        {market === 'BINARY' ? 'Pocket Option' : 'TradingView'}
      </div>
    </div>
  );
};

// --- Types ---
interface User {
  id: number;
  name: string;
  login: string;
  phone?: string;
  role: 'student' | 'admin';
  plan_name?: string;
  daysRemaining?: number;
  photo_url?: string;
  referral_code?: string;
  balance?: number;
}

interface Lesson {
  id: number;
  module_id: number;
  title: string;
  video_url: string;
  is_vip: number;
  completed?: boolean;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Plan {
  id: number;
  name: string;
  price: number;
  duration_type: string;
}

// --- Helpers ---
const getEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('player.vimeo.com') || url.includes('youtube.com/embed')) return url;

  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const base = "px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm sm:text-base";
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700",
    outline: "border border-zinc-700 hover:border-blue-500 text-zinc-300 hover:text-white bg-transparent",
    danger: "bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wider">{label}</label>}
    <input
      {...props}
      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm sm:text-base placeholder:text-zinc-600"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<any>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const pending = data.filter((w: any) => w.status === 'pending').length;
            setPendingWithdrawals(pending);
          }
        })
        .catch(console.error);
    }
  }, [user, view, token]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/student/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!user) return <Login onLogin={(t, u) => { setToken(t); setUser(u); localStorage.setItem('token', t); }} />;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      {/* Sidebar / Mobile Nav */}
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transform transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Trader <span className="text-blue-500">Academic</span></h1>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <NavItem active={view === 'dashboard'} icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} />
            <NavItem active={view === 'courses'} icon={<BookOpen size={20} />} label="Meus Cursos" onClick={() => { setView('courses'); setIsMenuOpen(false); }} />
            <NavItem active={view === 'signals'} icon={<Zap size={20} />} label="Sinais IA" onClick={() => { setView('signals'); setIsMenuOpen(false); }} />
            <NavItem active={view === 'calendar'} icon={<Calendar size={20} />} label="Calendário" onClick={() => { setView('calendar'); setIsMenuOpen(false); }} />
            <NavItem active={view === 'profile'} icon={<User size={20} />} label="Meu Perfil" onClick={() => { setView('profile'); setIsMenuOpen(false); }} />
            <NavItem active={view === 'referral'} icon={<Share2 size={20} />} label="Indique e Ganhe" onClick={() => { setView('referral'); setIsMenuOpen(false); }} />

            {user.role === 'admin' && (
              <div className="pt-6 mt-6 border-t border-zinc-800 space-y-2">
                <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Administração</p>
                <NavItem active={view === 'admin'} icon={<BarChart3 size={20} />} label="Painel Geral" onClick={() => { setView('admin'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'admin_users'} icon={<Users size={20} />} label="Alunos" onClick={() => { setView('admin_users'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'admin_referrals'} icon={<Share2 size={20} />} label="Indicações" onClick={() => { setView('admin_referrals'); setIsMenuOpen(false); }} />
                <NavItem
                  active={view === 'admin_withdrawals'}
                  icon={
                    <div className="relative">
                      <Wallet size={20} />
                      {pendingWithdrawals > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  }
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>Saques</span>
                      {pendingWithdrawals > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {pendingWithdrawals}
                        </span>
                      )}
                    </div>
                  }
                  onClick={() => { setView('admin_withdrawals'); setIsMenuOpen(false); }}
                />
                <NavItem active={view === 'admin_content'} icon={<Video size={20} />} label="Conteúdo" onClick={() => { setView('admin_content'); setIsMenuOpen(false); }} />
                <NavItem active={view === 'admin_plans'} icon={<CreditCard size={20} />} label="Planos" onClick={() => { setView('admin_plans'); setIsMenuOpen(false); }} />
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen p-3 sm:p-6 lg:p-10 flex flex-col">
        <div className="max-w-[1600px] mx-auto w-full flex-1">
          {/* Header */}
          <header className="flex items-center justify-between mb-6 sm:mb-10 gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2.5 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-zinc-800 active:scale-95 transition-transform">
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg sm:text-xl lg:text-3xl font-black tracking-tight truncate">Olá, {user.name}! 👋</h2>
              <p className="text-[10px] sm:text-xs lg:text-sm text-zinc-500 hidden sm:block font-medium">Bem-vindo de volta à sua jornada financeira.</p>
            </div>
            <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="https://wa.me/5569996078041" target="_blank" rel="noreferrer" className="hidden sm:block">
                <Button variant="secondary" className="h-10 sm:h-12">
                  <MessageSquare size={18} />
                  <span className="hidden md:inline">Suporte</span>
                </Button>
              </a>
              <button
                onClick={logout}
                className="lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                {user.photo_url ? <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <User size={20} className="text-zinc-500" />}
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <StudentDashboard user={user} token={token!} />}
              {view === 'courses' && <CoursesView token={token!} user={user} />}
              {view === 'signals' && <SignalsView token={token!} user={user} />}
              {view === 'calendar' && <CalendarView />}
              {view === 'profile' && <ProfileView user={user} token={token!} onUpdate={fetchUser} />}
              {view === 'referral' && <ReferralView token={token!} />}
              {view === 'admin' && <AdminDashboard token={token!} setView={setView} />}
              {view === 'admin_users' && <AdminUsers token={token!} />}
              {view === 'admin_referrals' && <AdminReferrals token={token!} />}
              {view === 'admin_withdrawals' && <AdminWithdrawals token={token!} />}
              {view === 'admin_content' && <AdminContent token={token!} />}
              {view === 'admin_plans' && <AdminPlans token={token!} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  );
}

// --- Views ---

function Login({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsRegistering(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const body = isRegistering ? { name, login, password, phone, referral_code: referralCode } : { login, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mx-auto mb-6">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">Trader Academic</h1>
          <p className="text-zinc-500 mt-2">Sua evolução financeira começa aqui.</p>
        </div>

        <Card className="bg-zinc-950/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <>
                <Input
                  label="Nome Completo"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Celular / WhatsApp"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  required
                />
                <Input
                  label="Código de Indicação (Opcional)"
                  placeholder="ABC123"
                  value={referralCode}
                  onChange={(e: any) => setReferralCode(e.target.value)}
                />
              </>
            )}
            <Input
              label="Login"
              placeholder="Seu usuário"
              value={login}
              onChange={(e: any) => setLogin(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? 'Processando...' : isRegistering ? 'Criar Conta Grátis' : 'Acessar Plataforma'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se grátis'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard({ user, token }: { user: User, token: string }) {
  const [stats, setStats] = useState({ progress: 0, totalLessons: 0, completedLessons: 0 });
  const [latestLessons, setLatestLessons] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchLatestLessons();
  }, []);

  const fetchLatestLessons = async () => {
    const res = await fetch('/api/lessons/latest', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setLatestLessons(await res.json());
  };

  const fetchStats = async () => {
    const resCourses = await fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
    const resProgress = await fetch('/api/progress', { headers: { 'Authorization': `Bearer ${token}` } });

    if (resCourses.ok && resProgress.ok) {
      const courses = await resCourses.json();
      const progress = await resProgress.json();

      let total = 0;
      courses.forEach((m: Module) => total += m.lessons.length);

      setStats({
        totalLessons: total,
        completedLessons: progress.length,
        progress: total > 0 ? Math.round((progress.length / total) * 100) : 0
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="flex flex-col justify-between p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 sm:p-4 bg-blue-500/10 rounded-2xl">
              <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <span className="text-[10px] sm:text-xs font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Ativo</span>
          </div>
          <div>
            <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1">Plano Atual</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">{user.plan_name || 'Nenhum'}</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-medium">
              {user.plan_name === 'Plano Free' ? 'Acesso Básico' : `${user.daysRemaining} dias restantes`}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-2xl">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1">Progresso Geral</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.progress}%</h3>
            <div className="w-full bg-zinc-800 h-2.5 rounded-full mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 sm:p-4 bg-purple-500/10 rounded-2xl">
              <BookOpen className="text-purple-500" size={24} />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1">Aulas Concluídas</p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">{stats.completedLessons} / {stats.totalLessons}</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-medium italic">Continue focado na sua evolução!</p>
          </div>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Últimas Aulas</h3>
          <div className="space-y-3">
            {latestLessons.length > 0 ? latestLessons.map((lesson, i) => (
              <div key={lesson.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all cursor-pointer group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                  <Play size={20} className="text-zinc-400 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{lesson.title}</h4>
                  <p className="text-xs text-zinc-500">{lesson.module_title}</p>
                </div>
                <ChevronRight size={20} className="text-zinc-600 hidden sm:block" />
              </div>
            )) : (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                Nenhuma aula encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Suporte Direto</h3>
          <Card className="bg-blue-600/5 border-blue-500/20">
            <p className="text-zinc-300 mb-6">Precisa de ajuda com alguma aula ou tem dúvidas sobre o mercado? Nossa equipe está pronta para te atender.</p>
            <a href="https://wa.me/5569996078041" target="_blank" rel="noreferrer">
              <Button className="w-full">
                <MessageSquare size={20} />
                Falar com Mentor no WhatsApp
              </Button>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CalendarView() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-500" /> Calendário Econômico
          </h2>
          <p className="text-zinc-400">Acompanhe as notícias de alto impacto que afetam o mercado em tempo real.</p>
        </div>
        <a
          href="https://pt.investing.com/economic-calendar/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-zinc-700"
        >
          <Plus size={18} className="rotate-45" />
          ABRIR EXTERNO
        </a>
      </div>

      <div className="bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/5 min-h-[600px] border border-zinc-800 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-zinc-500 text-sm">Carregando calendário do Investing.com...</p>
            </div>
          </div>
        )}

        <iframe
          src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=1,2,3&features=datepicker,timezone&countries=25,32,6,37,7,5,22,11,35,39,12,4,10,36,43,38,26,17,42,15,45,20,34,18,41,27,110,16,24,23,33,29,19,44,28,30,31,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109&calType=day&timeZone=12&lang=12"
          width="100%"
          height="800"
          className="border-none bg-white"
          onLoad={() => setIsLoading(false)}
          referrerPolicy="no-referrer"
          title="Investing.com Economic Calendar"
        ></iframe>

        {!isLoading && (
          <div className="absolute bottom-4 right-4 z-20">
            <p className="text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm">
              Se o calendário não aparecer, verifique se o seu navegador não está bloqueando cookies de terceiros.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <p className="text-xs text-zinc-500 text-center">
          O calendário econômico é essencial para evitar operar em horários de alta volatilidade (3 touros).
          Caso a tela continue branca, <a href="https://pt.investing.com/economic-calendar/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">clique aqui</a> para acessar diretamente.
        </p>
      </div>
    </div>
  );
}

function SignalsView({ token, user }: { token: string, user: User }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [marketFilter, setMarketFilter] = useState<'FOREX' | 'BINARY' | 'CRYPTO' | 'FUTURES' | 'COMMODITIES'>('BINARY');
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [isGenerating, setIsGenerating] = useState(false);

  const hasPlan = user.role === 'admin' || (user.plan_name && user.plan_name !== 'Plano Free' && user.daysRemaining && user.daysRemaining > 0);

  const assetsByMarket = {
    FOREX: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
    BINARY: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BTC/USD'],
    CRYPTO: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'BNB/USD', 'XRP/USD'],
    FUTURES: ['WINJ26', 'WDOJ26', 'MINI INDICE', 'MINI DOLAR'],
    COMMODITIES: ['GOLD', 'SILVER', 'OIL', 'NATGAS', 'COPPER']
  };

  useEffect(() => {
    setSelectedAsset(assetsByMarket[marketFilter][0]);
  }, [marketFilter]);

  useEffect(() => {
    fetchSignals();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'NEW_SIGNAL') {
          setSignals([message.data]);
        } else if (message.type === 'CLEAR_SIGNALS') {
          setSignals([]);
        }
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    return () => ws.close();
  }, []);

  const fetchSignals = async () => {
    const res = await fetch('/api/signals', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setSignals(await res.json());
  };

  const handleManualGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/signals/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: selectedAsset,
          market: marketFilter,
          is_otc: false
        })
      });
      if (res.ok) {
        const newSignal = await res.json();
        setSignals([newSignal]);
      }
    } catch (e) {
      console.error('Error generating signal:', e);
    } finally {
      setTimeout(() => setIsGenerating(false), 2000);
    }
  };

  const handleClearSignals = async () => {
    if (!confirm('Deseja realmente excluir todos os sinais?')) return;
    try {
      const res = await fetch('/api/signals/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSignals([]);
    } catch (e) {
      console.error('Error clearing signals:', e);
    }
  };

  const filteredSignals = signals.filter(s => {
    return s.market === marketFilter;
  });

  if (!hasPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 sm:mb-8">
          <Lock size={40} className="text-blue-500 sm:size-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mb-4 uppercase tracking-tight">Sinais de IA Bloqueados</h2>
        <p className="text-zinc-500 mb-8 max-w-md text-sm sm:text-base font-medium leading-relaxed">Os sinais de IA em tempo real são exclusivos para alunos VIP. Obtenha um plano ativo para liberar o acesso agora mesmo!</p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button onClick={() => window.open('https://wa.me/5569996078041', '_blank')} className="w-full sm:w-auto">
            <MessageSquare size={20} />
            <span>Falar com Suporte</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3 uppercase tracking-wider text-zinc-400">
            <Zap className="text-yellow-500" /> Sinais de IA em Tempo Real
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">Análise automatizada para Forex e Opções Binárias</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black animate-pulse w-fit border border-emerald-500/20 uppercase tracking-widest">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          LIVE
        </div>
      </div>

      {/* Filters & Manual Generation */}
      <div className="bg-zinc-900/30 p-6 sm:p-10 rounded-[2.5rem] border border-zinc-800/50 space-y-10">
        <div className="grid grid-cols-1 xl:flex xl:flex-wrap items-end gap-8">
          <div className="space-y-4 w-full xl:flex-1 min-w-0">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Selecione o Mercado</label>
            <div className="flex bg-zinc-950/50 p-2 rounded-2xl overflow-x-auto custom-scrollbar border border-zinc-800/50 gap-2">
              {['FOREX', 'BINARY', 'CRYPTO', 'FUTURES', 'COMMODITIES'].map((m: any) => (
                <button
                  key={m}
                  onClick={() => setMarketFilter(m)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all shrink-0 uppercase tracking-widest border border-transparent ${marketFilter === m ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 border-blue-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}
                >
                  {m === 'BINARY' ? 'Binárias' : m === 'COMMODITIES' ? 'Matérias Primas' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex items-end gap-6 w-full xl:w-auto">
            <div className="space-y-4 w-full">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Ativo</label>
              <div className="relative">
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-sm font-black rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[180px] cursor-pointer hover:border-zinc-700 transition-all text-zinc-300"
                >
                  {assetsByMarket[marketFilter].map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-zinc-600 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:col-span-1">
              <button
                onClick={handleManualGenerate}
                disabled={isGenerating}
                className={`flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 text-black px-8 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest active:scale-95`}
              >
                {isGenerating ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
                <span>{isGenerating ? 'Analisando...' : 'Gerar Sinal'}</span>
              </button>
              <button
                onClick={handleClearSignals}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-600 hover:text-rose-500 p-4 rounded-2xl transition-all border border-zinc-800 active:scale-95"
                title="Limpar Histórico"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="w-full sm:col-span-2 lg:col-span-1">
              {marketFilter === 'BINARY' ? (
                <a
                  href="https://u3.shortink.io/register?utm_campaign=825331&utm_source=affiliate&utm_medium=sr&a=I1E2AjK7BmBUHR&ac=salaviptraderacademic&code=50START"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 uppercase tracking-widest border border-emerald-500/20"
                >
                  <Plus size={22} />
                  <span>CADASTRO POCKET OPTION</span>
                </a>
              ) : (
                <a
                  href="http://live.4xc.com/signup/V0n2AVy1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest border border-blue-500/20"
                >
                  <Plus size={22} />
                  <span>CADASTRO 4XC (FOREX)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredSignals.length === 0 && (
          <div className="col-span-full py-24 text-center text-zinc-600 bg-zinc-900/20 rounded-[2.5rem] border-2 border-dashed border-zinc-800/50">
            <Activity size={64} className="mx-auto mb-6 opacity-10" />
            <p className="font-black uppercase tracking-widest text-xs">Aguardando novos sinais da IA...</p>
          </div>
        )}
        {filteredSignals.map((signal, i) => (
          <motion.div
            key={signal.id || i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 sm:p-8 rounded-[2rem] border-2 transition-all hover:shadow-2xl ${signal.type === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30'}`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${signal.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  {signal.type === 'BUY' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">{signal.asset}</h3>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">{signal.market} • {signal.timeframe}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black tracking-tighter ${signal.type === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {signal.type === 'BUY' ? 'COMPRA' : 'VENDA'}
                </div>
                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{new Date(signal.created_at).toLocaleTimeString()}</div>
              </div>
            </div>

            <TradingViewChart symbol={signal.asset} market={signal.market} />

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">
                  {signal.market === 'BINARY' ? 'Horário' : 'Região'}
                </div>
                <div className="font-mono text-sm">
                  {signal.market === 'BINARY' ? signal.entry_time : signal.entry_price}
                </div>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Assertividade</div>
                <div className="text-emerald-400 font-bold text-sm">{signal.accuracy}%</div>
              </div>
            </div>

            {signal.market === 'BINARY' ? (
              <div className="space-y-3">
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
                  <div className="text-[10px] text-blue-400 uppercase font-bold">Expiração</div>
                  <div className="font-bold text-blue-400">{signal.expiration}</div>
                </div>
                <div className="text-center py-1 bg-zinc-800/50 rounded-lg text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Realizar entrada às {signal.entry_time}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <div className="text-[10px] text-rose-500 uppercase font-bold">Stop Loss</div>
                  <div className="font-mono text-sm text-rose-400">{signal.stop_loss}</div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-500 uppercase font-bold">Take Profit</div>
                  <div className="font-mono text-sm text-emerald-400">{signal.take_profit}</div>
                </div>
              </div>
            )}

            {signal.reasoning && (
              <div className="mt-4 p-3 bg-zinc-800/30 rounded-xl border border-zinc-700/30">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                  <Brain size={12} className="text-blue-400" /> Fundamentos da IA
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  "{signal.reasoning}"
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CoursesView({ token, user }: { token: string, user: User }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Lesson | null>(null);

  const hasPlan = user.role === 'admin' || (user.plan_name && user.plan_name !== 'Plano Free' && user.daysRemaining && user.daysRemaining > 0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resCourses = await fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
    const resProgress = await fetch('/api/progress', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resCourses.ok) setModules(await resCourses.json());
    if (resProgress.ok) setProgress(await resProgress.json());
  };

  const toggleProgress = async (lessonId: number) => {
    const res = await fetch('/api/progress/toggle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lesson_id: lessonId })
    });
    if (res.ok) {
      setProgress(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
    }
  };

  const canWatch = (lesson: Lesson) => {
    if (user.role === 'admin') return true;
    if (!lesson.is_vip) return true;
    return hasPlan;
  };

  const isLocalVideo = (url: string) => url.startsWith('/uploads/');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
      {/* Video Player */}
      <div className="lg:col-span-2 space-y-6">
        {selectedVideo ? (
          canWatch(selectedVideo) ? (
            <div className="space-y-6">
              <div className="aspect-video bg-zinc-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
                {selectedVideo.video_url ? (
                  isLocalVideo(selectedVideo.video_url) ? (
                    <video
                      src={selectedVideo.video_url}
                      className="w-full h-full"
                      controls
                      controlsList="nodownload"
                    />
                  ) : (
                    <iframe
                      src={getEmbedUrl(selectedVideo.video_url)}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <Video size={48} className="opacity-20" />
                    <p>Vídeo não disponível</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black">{selectedVideo.title}</h3>
                <Button
                  variant={progress.includes(selectedVideo.id) ? 'secondary' : 'primary'}
                  onClick={() => toggleProgress(selectedVideo.id)}
                  className="w-full sm:w-auto"
                >
                  {progress.includes(selectedVideo.id) ? <CheckCircle size={20} className="text-emerald-500" /> : <Play size={20} />}
                  <span>{progress.includes(selectedVideo.id) ? 'Concluída' : 'Marcar como Concluída'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-zinc-950 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-6 sm:p-12 border border-zinc-800">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                <Lock size={32} className="text-blue-500 sm:hidden" />
                <Lock size={48} className="text-blue-500 hidden sm:block" />
              </div>
              <h3 className="text-xl sm:text-3xl font-black mb-3">Conteúdo VIP</h3>
              <p className="text-zinc-500 mb-8 max-w-md text-sm sm:text-base">Esta aula é exclusiva para alunos com plano ativo. Obtenha o VIP para liberar o acesso agora mesmo!</p>
              <a href="https://wa.me/5569996078041" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                <Button className="w-full sm:px-10">
                  <CreditCard size={20} />
                  Obter Acesso VIP
                </Button>
              </a>
            </div>
          )
        ) : (
          <div className="aspect-video bg-zinc-900 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 border-dashed">
            <Video size={64} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Selecione uma aula para começar a assistir</p>
          </div>
        )}
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        <h3 className="text-lg sm:text-xl font-black flex items-center gap-2 uppercase tracking-wider text-zinc-400">
          <BookOpen size={20} className="text-blue-500" />
          Conteúdo do Curso
        </h3>
        <div className="space-y-6 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {modules.map((module) => (
            <div key={module.id} className="space-y-3">
              <h4 className="text-[10px] sm:text-xs font-black text-zinc-600 uppercase tracking-[0.2em] px-2">{module.title}</h4>
              <div className="space-y-2">
                {module.lessons.map((lesson) => {
                  const locked = !canWatch(lesson);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedVideo(lesson)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group border ${selectedVideo?.id === lesson.id ? 'bg-blue-600/10 border-blue-500/30 text-white' : 'hover:bg-zinc-900 border-transparent text-zinc-500'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${locked ? 'bg-zinc-800 text-zinc-600' : progress.includes(lesson.id) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                        {locked ? <Lock size={18} /> : progress.includes(lesson.id) ? <CheckCircle size={18} /> : <Play size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold block truncate">{lesson.title}</span>
                        {lesson.is_vip === 1 && (
                          <span className="mt-1 inline-block text-[8px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">VIP</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileView({ user, token, onUpdate }: { user: User, token: string, onUpdate: () => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user.photo_url || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, password, photo_url: photoUrl })
      });
      if (res.ok) {
        alert('Perfil atualizado com sucesso!');
        onUpdate();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar perfil');
      }
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <Card className="p-8 sm:p-12 border-zinc-800">
        <div className="flex flex-col items-center mb-12">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-zinc-900 border-4 border-zinc-800 overflow-hidden mb-6 shadow-2xl transition-all group-hover:border-blue-500/50">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                  <User size={64} className="text-zinc-700" />
                </div>
              )}
            </div>
            <label className="absolute bottom-6 right-0 p-3 bg-blue-600 rounded-2xl cursor-pointer hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-90">
              <Plus size={24} className="text-white" />
              <input type="file" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{user.name}</h3>
          <p className="text-zinc-500 font-black text-xs uppercase tracking-widest mt-1">{user.login}</p>
        </div>

        <div className="space-y-8">
          <Input label="Nome Completo" value={name} onChange={(e: any) => setName(e.target.value)} />
          <Input label="Celular / WhatsApp" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
          <Input label="Nova Senha (deixe em branco para não alterar)" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          <Input label="Login (não alterável)" value={user.login} disabled />
          <div className="pt-6">
            <Button onClick={handleSave} className="w-full py-4 text-base" disabled={loading}>
              {loading ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} />}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// --- Admin Views ---

function AdminDashboard({ token, setView }: { token: string, setView: (v: any) => void }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Total de Alunos" value={stats.totalUsers} icon={<Users className="text-blue-500" />} />
        <StatCard label="Alunos Ativos" value={stats.activeUsers} icon={<ShieldCheck className="text-emerald-500" />} />
        <StatCard label="Saques Pendentes" value={stats.pendingWithdrawals} icon={<Wallet className={`text-yellow-500 ${stats.pendingWithdrawals > 0 ? 'animate-pulse' : ''}`} />} />
        <StatCard label="Receita Total" value={`R$ ${Number(stats.totalRevenue || 0).toFixed(2)}`} icon={<TrendingUp className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <Card className="p-6 sm:p-10">
          <h3 className="text-lg sm:text-xl font-black mb-8 uppercase tracking-wider text-zinc-400">Visão Geral Financeira</h3>
          <div className="h-64 flex items-end gap-2 sm:gap-4">
            {[40, 70, 55, 90, 65, 85, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="w-full bg-blue-600/20 border-t-2 border-blue-500 rounded-t-xl shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                />
                <span className="text-[8px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-tighter">DIA {i + 1}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 sm:p-10">
          <h3 className="text-lg sm:text-xl font-black mb-8 uppercase tracking-wider text-zinc-400">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <QuickAction icon={<Plus size={24} />} label="Novo Aluno" color="blue" onClick={() => setView('admin_users')} />
            <QuickAction icon={<Video size={24} />} label="Nova Aula" color="purple" onClick={() => setView('admin_content')} />
            <QuickAction icon={<CreditCard size={24} />} label="Novo Plano" color="emerald" onClick={() => setView('admin_plans')} />
            <QuickAction icon={<Settings size={24} />} label="Configurações" color="zinc" onClick={() => setView('profile')} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <Card className="flex items-center gap-5 p-6 sm:p-8">
      <div className="p-4 sm:p-5 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-xl sm:text-2xl lg:text-3xl font-black">{value}</h4>
      </div>
    </Card>
  );
}

function QuickAction({ icon, label, color, onClick }: any) {
  const colors: any = {
    blue: "bg-blue-600/5 text-blue-500 hover:bg-blue-600 hover:text-white border-blue-500/10 hover:border-blue-500/40",
    purple: "bg-purple-600/5 text-purple-500 hover:bg-purple-600 hover:text-white border-purple-500/10 hover:border-purple-500/40",
    emerald: "bg-emerald-600/5 text-emerald-500 hover:bg-emerald-600 hover:text-white border-emerald-500/10 hover:border-emerald-500/40",
    zinc: "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border-zinc-800 hover:border-zinc-600"
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 active:scale-95 ${colors[color]}`}
    >
      {icon}
      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}

function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', login: '', password: '', phone: '', plan_id: '', access_days: 30, is_blocked: 0, commission_rate: 10.0
  });

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const fetchPlans = async () => {
    const res = await fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setPlans(await res.json());
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        login: user.login,
        password: user.password,
        phone: user.phone || '',
        plan_id: user.plan_id || '',
        access_days: user.access_days,
        is_blocked: user.is_blocked || 0,
        commission_rate: user.commission_rate || 10.0
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', login: '', password: '', phone: '', plan_id: '', access_days: 30, is_blocked: 0, commission_rate: 10.0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const handleAddDays = async (userId: number, days: number) => {
    const res = await fetch(`/api/admin/users/${userId}/add-days`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ days })
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Gestão de Alunos</h3>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Adicionar Aluno
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Aluno</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Plano</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Progresso</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-sm sm:text-base">{u.name}</div>
                    <div className="text-[10px] text-zinc-500 font-medium mt-0.5">{u.login} • {u.phone || 'Sem tel'}</div>
                    {u.referrer_name && (
                      <div className="text-[10px] text-blue-400 font-black uppercase tracking-tighter mt-1 bg-blue-500/5 px-2 py-0.5 rounded-md w-fit border border-blue-500/10">
                        Indicado por: {u.referrer_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg w-fit uppercase tracking-tighter">{u.plan_name || 'S/ Plano'}</span>
                      <span className="text-[10px] text-zinc-600 font-bold">{u.access_days} dias restantes</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {u.is_blocked ? (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg uppercase tracking-tighter">Bloqueado</span>
                    ) : (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg uppercase tracking-tighter">Ativo</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden min-w-[60px]">
                        <div className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${u.total_lessons > 0 ? (u.completed_lessons / u.total_lessons) * 100 : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-black">{u.total_lessons > 0 ? Math.round((u.completed_lessons / u.total_lessons) * 100) : 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="p-2.5 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Editar Aluno"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => handleAddDays(u.id, 30)}
                        className="p-2.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                        title="+30 Dias"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{editingUser ? 'Editar Aluno' : 'Novo Aluno'}</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nome" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />
                <Input label="Login" value={formData.login} onChange={(e: any) => setFormData({ ...formData, login: e.target.value })} required />
                <Input label="Senha" type="text" value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} required />
                <Input label="Telefone" value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} required />
                <Input label="Comissão por Indicação (R$)" type="number" value={formData.commission_rate} onChange={(e: any) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })} required />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">Plano</label>
                    <select
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={formData.plan_id}
                      onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <Input label="Dias de Acesso" type="number" value={formData.access_days} onChange={(e: any) => setFormData({ ...formData, access_days: parseInt(e.target.value) })} required />
                </div>

                <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <input
                    type="checkbox"
                    id="is_blocked"
                    checked={formData.is_blocked === 1}
                    onChange={(e) => setFormData({ ...formData, is_blocked: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_blocked" className="text-sm font-medium text-zinc-300 cursor-pointer">Bloquear acesso do aluno</label>
                </div>

                <Button type="submit" className="w-full py-3">
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ReferralView({ token }: { token: string }) {
  const [stats, setStats] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchWithdrawals();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/referrals/stats', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setStats(await res.json());
  };

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setWithdrawals(await res.json());
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 50) return alert('O valor mínimo para saque é R$ 50,00');
    if (!pixKey) return alert('Chave PIX obrigatória');

    setLoading(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount), pix_key: pixKey })
      });
      if (res.ok) {
        alert('Solicitação de saque enviada com sucesso! Prazo de até 48h.');
        setAmount('');
        fetchStats();
        fetchWithdrawals();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      alert('Erro ao solicitar saque');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(link);
    alert('Link de indicação copiado!');
  };

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard label="Total Indicados" value={stats.total_referred} icon={<Users className="text-blue-500" />} />
        <StatCard label="Planos Fechados" value={stats.total_converted} icon={<ShieldCheck className="text-emerald-500" />} />
        <StatCard label="Saldo Disponível" value={`R$ ${Number(stats.balance || 0).toFixed(2)}`} icon={<Wallet className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <Card className="p-6 sm:p-10">
          <h3 className="text-lg sm:text-xl font-black mb-8 uppercase tracking-wider text-zinc-400">Seu Link de Indicação</h3>
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1 min-w-0 w-full">
              <p className="text-[10px] text-zinc-600 mb-2 uppercase font-black tracking-widest">Link de Cadastro:</p>
              <code className="text-blue-500 font-mono text-sm block truncate bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">{window.location.origin}/?ref={stats.referral_code}</code>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => window.open(`${window.location.origin}/?ref=${stats.referral_code}`, '_blank')}
                className="flex-1 sm:flex-none p-3.5 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-white border border-zinc-800 active:scale-95"
                title="Testar Link"
              >
                <Share2 size={22} className="mx-auto" />
              </button>
              <button onClick={copyLink} className="flex-1 sm:flex-none p-3.5 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                <Copy size={22} className="mx-auto" />
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-6 font-medium italic">Indique amigos e ganhe comissão por cada plano pago que eles assinarem!</p>
        </Card>

        <Card className="p-6 sm:p-10">
          <h3 className="text-lg sm:text-xl font-black mb-8 uppercase tracking-wider text-zinc-400">Solicitar Saque</h3>
          <form onSubmit={handleWithdraw} className="space-y-6">
            <Input label="Chave PIX" placeholder="CPF, E-mail ou Telefone" value={pixKey} onChange={(e: any) => setPixKey(e.target.value)} required />
            <div className="space-y-2">
              <Input label="Valor do Saque (R$)" type="number" placeholder="0.00" value={amount} onChange={(e: any) => setAmount(e.target.value)} required />
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Saque mínimo: R$ 50,00</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Wallet size={20} />}
              <span>{loading ? 'Processando...' : 'Solicitar Saque'}</span>
            </Button>
            <p className="text-[10px] text-zinc-500 text-center font-medium">O prazo para pagamento é de até 48 horas úteis.</p>
          </form>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-zinc-800">
        <div className="p-6 sm:p-8 border-b border-zinc-800 bg-zinc-900/30">
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-zinc-400">Histórico de Saques</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Data</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Chave PIX</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-5 text-sm font-bold text-zinc-400">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-5 font-black text-lg">R$ {Number(w.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-5 text-xs text-zinc-500 font-mono">{w.pix_key}</td>
                  <td className="px-6 py-5">
                    {w.status === 'completed' ? (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg uppercase tracking-tighter">Concluído</span>
                    ) : (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg uppercase tracking-tighter">Pendente</span>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-zinc-600 font-medium italic">Nenhum saque solicitado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AdminReferrals({ token }: { token: string }) {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [editingReferrer, setEditingReferrer] = useState<any>(null);
  const [newRate, setNewRate] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = () => {
    fetch('/api/admin/referrals', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(setReferrals);
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferrer) return;

    const res = await fetch(`/api/admin/referrals/${editingReferrer.id}/commission`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ commission_earned: parseFloat(newRate) })
    });

    if (res.ok) {
      setEditingReferrer(null);
      fetchReferrals();
      alert('Comissão atualizada com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-zinc-400">Todas as Indicações</h3>
      <Card className="p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Quem Indicou</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Quem foi Indicado</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Comissão</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Data</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {referrals.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-5 font-bold text-sm sm:text-base">{r.referrer_name}</td>
                  <td className="px-6 py-5 font-bold text-sm sm:text-base">{r.referred_name}</td>
                  <td className="px-6 py-5">
                    {r.status === 'converted' ? (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg uppercase tracking-tighter">Pago</span>
                    ) : (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-zinc-800 text-zinc-500 rounded-lg uppercase tracking-tighter">Registrado</span>
                    )}
                  </td>
                  <td className="px-6 py-5 font-black text-emerald-500 text-base">R$ {Number(r.commission_earned || 0).toFixed(2)}</td>
                  <td className="px-6 py-5 text-[10px] text-zinc-600 font-bold">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => {
                        setEditingReferrer(r);
                        setNewRate(r.commission_earned.toString());
                      }}
                      className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                      title="Ajustar Comissão desta Indicação"
                    >
                      <Settings size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Commission Modal */}
      {editingReferrer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Ajustar Comissão</h3>
                <button onClick={() => setEditingReferrer(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
                Ajuste o valor da comissão para esta indicação específica. Se já estiver paga, o saldo de <span className="text-white font-black">{editingReferrer.referrer_name}</span> será ajustado automaticamente.
              </p>
              <form onSubmit={handleUpdateCommission} className="space-y-6">
                <Input
                  label="Valor da Comissão (R$)"
                  type="number"
                  step="0.01"
                  value={newRate}
                  onChange={(e: any) => setNewRate(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">Salvar Alteração</Button>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AdminWithdrawals({ token }: { token: string }) {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/admin/withdrawals', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setWithdrawals(await res.json());
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchWithdrawals();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-zinc-400">Solicitações de Saque</h3>
      <Card className="p-0 overflow-hidden border-zinc-800">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Aluno</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Valor</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Chave PIX</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Data</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-sm sm:text-base">{w.user_name}</div>
                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter mt-0.5">ID: {w.user_id}</div>
                  </td>
                  <td className="px-6 py-5 font-black text-lg text-emerald-500">R$ {Number(w.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-5 text-xs text-zinc-500 font-mono">{w.pix_key}</td>
                  <td className="px-6 py-5 text-[10px] text-zinc-600 font-bold">{new Date(w.created_at).toLocaleString()}</td>
                  <td className="px-6 py-5">
                    {w.status === 'completed' ? (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg uppercase tracking-tighter">Concluído</span>
                    ) : (
                      <span className="text-[10px] font-black px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg uppercase tracking-tighter">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {w.status === 'pending' && (
                      <Button onClick={() => handleUpdateStatus(w.id, 'completed')} className="h-9 px-4 text-xs">
                        Marcar Pago
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-600 font-medium italic">Nenhuma solicitação de saque pendente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
function AdminContent({ token }: { token: string }) {
  const [modules, setModules] = useState<any[]>([]);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newModule, setNewModule] = useState({ title: '' });
  const [newLesson, setNewLesson] = useState({ module_id: '', title: '', video_url: '', is_vip: false });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const res = await fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setModules(await res.json());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await fetch('/api/admin/upload-video', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.status === 413) {
        alert('O arquivo é muito grande para o servidor.');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setNewLesson(prev => ({ ...prev, video_url: data.url }));
        console.log('Upload concluído:', data.url);
      } else {
        alert(data.error || 'Erro no upload');
      }
    } catch (err) {
      console.error('Erro no fetch upload:', err);
      alert('Erro ao enviar arquivo. Verifique sua conexão.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/modules', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newModule)
    });
    if (res.ok) {
      setShowAddModule(false);
      fetchContent();
      setNewModule({ title: '' });
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(newLesson)
    });
    if (res.ok) {
      setShowAddLesson(false);
      fetchContent();
      setNewLesson({ module_id: '', title: '', video_url: '', is_vip: false });
    }
  };

  const deleteLesson = async (id: number) => {
    if (!confirm('Deseja excluir esta aula?')) return;
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchContent();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-zinc-400">Gestão de Conteúdo</h3>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setShowAddModule(true)}>Novo Módulo</Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setShowAddLesson(true)}>Nova Aula</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        {modules.map(m => (
          <Card key={m.id} className="p-6 sm:p-10 border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-xl uppercase tracking-tight">{m.title}</h4>
              <span className="text-[10px] font-black px-2.5 py-1 bg-zinc-900 text-zinc-500 rounded-lg uppercase tracking-widest">{m.lessons.length} aulas</span>
            </div>
            <div className="space-y-3">
              {m.lessons.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500">
                      <Video size={18} />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-zinc-300">{l.title}</span>
                  </div>
                  <button onClick={() => deleteLesson(l.id)} className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {m.lessons.length === 0 && (
                <p className="text-xs text-zinc-600 italic text-center py-4">Nenhuma aula neste módulo.</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modals */}
      {showAddModule && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Novo Módulo</h3>
                <button onClick={() => setShowAddModule(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddModule} className="space-y-6">
                <Input label="Título do Módulo" value={newModule.title} onChange={(e: any) => setNewModule({ title: e.target.value })} required />
                <Button type="submit" className="w-full">Criar Módulo</Button>
              </form>
            </Card>
          </motion.div>
        </div>
      )}

      {showAddLesson && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg">
            <Card className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Nova Aula</h3>
                <button onClick={() => setShowAddLesson(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddLesson} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Módulo</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    value={newLesson.module_id}
                    onChange={(e) => setNewLesson({ ...newLesson, module_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione um módulo</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
                <Input label="Título da Aula" value={newLesson.title} onChange={(e: any) => setNewLesson({ ...newLesson, title: e.target.value })} required />

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Vídeo da Aula</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Link do YouTube ou Vimeo"
                        value={newLesson.video_url}
                        onChange={(e: any) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                      />
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ou cole um link externo</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id="video-upload"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="video-upload"
                        className={`flex flex-col items-center justify-center h-[54px] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading ? 'bg-zinc-950 border-zinc-900' : 'border-zinc-800 hover:border-blue-500 hover:bg-blue-500/5'}`}
                      >
                        {uploading ? (
                          <Loader2 size={20} className="animate-spin text-blue-500" />
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-widest">
                            <Upload size={18} />
                            <span>Upload Local</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  {newLesson.video_url.startsWith('/uploads/') && (
                    <p className="text-xs text-emerald-500 flex items-center gap-2 font-bold">
                      <CheckCircle size={14} /> Vídeo carregado com sucesso!
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    id="is_vip"
                    checked={newLesson.is_vip}
                    onChange={(e) => setNewLesson({ ...newLesson, is_vip: e.target.checked })}
                    className="w-6 h-6 rounded-lg bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-blue-500/50 transition-all cursor-pointer"
                  />
                  <label htmlFor="is_vip" className="text-sm font-black text-zinc-400 uppercase tracking-widest cursor-pointer group-hover:text-zinc-200 transition-colors">Marcar como Aula VIP</label>
                </div>
                <Button type="submit" className="w-full">Publicar Aula</Button>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AdminPlans({ token }: { token: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration_type: 'monthly', description: '' });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const res = await fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setPlans(await res.json());
  };

  const handleOpenModal = (plan: any = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ name: plan.name, price: plan.price.toString(), duration_type: plan.duration_type, description: plan.description || '' });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', price: '', duration_type: 'monthly', description: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
    const method = editingPlan ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price)
      })
    });

    if (res.ok) {
      setShowModal(false);
      fetchPlans();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este plano? Ao excluir, os alunos vinculados a este plano ficarão sem plano definido.')) return;
    try {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlans();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir plano');
      }
    } catch (e) {
      alert('Erro de conexão ao excluir plano');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-zinc-400">Gestão de Planos</h3>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto"><Plus size={20} /> Novo Plano</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {plans.map(p => (
          <Card key={p.id} className="relative overflow-hidden flex flex-col p-8 sm:p-10 border-zinc-800 group hover:border-zinc-700 transition-all">
            <div className="absolute top-4 right-4 flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
              <button
                onClick={() => handleDelete(p.id)}
                className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Excluir Plano"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <h4 className="text-xl sm:text-2xl font-black mb-4 pr-10 uppercase tracking-tight">{p.name}</h4>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl sm:text-4xl font-black text-blue-500">R$ {Number(p.price || 0).toFixed(2)}</span>
              <span className="text-zinc-600 text-xs font-black uppercase tracking-widest">/ {p.duration_type === 'monthly' ? 'Mês' : p.duration_type === 'annual' ? 'Ano' : 'Vitalício'}</span>
            </div>
            <p className="text-sm text-zinc-500 mb-8 flex-1 font-medium leading-relaxed italic">{p.description}</p>
            <Button variant="outline" className="w-full" onClick={() => handleOpenModal(p)}>Editar Plano</Button>
          </Card>
        ))}
      </div>

      {/* Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Nome do Plano" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} required />
                <Input label="Preço (R$)" type="number" step="0.01" value={formData.price} onChange={(e: any) => setFormData({ ...formData, price: e.target.value })} required />
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Duração</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    value={formData.duration_type}
                    onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                    required
                  >
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                    <option value="lifetime">Vitalício</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Descrição</label>
                  <textarea
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                    rows={4}
                    placeholder="Descreva os benefícios do plano..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">{editingPlan ? 'Salvar Alterações' : 'Criar Plano'}</Button>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
