import React, { useState, useEffect, useCallback } from "react";
import { NeuralAnalyzerSidebar } from "./NeuralAnalyzerSidebar";
import { TradingViewRealChart } from "./TradingViewRealChart";
import { HioveBrokerFrame } from "./HioveBrokerFrame";
import { OperationsModal } from "./OperationsModal";
import { FinancialModal } from "./FinancialModal";
import { CopyTraderModal } from "./CopyTraderModal";
import { DailyBonusModal } from "./DailyBonusModal";
import { EconomicCalendarModal } from "./EconomicCalendarModal";
import { IndicatorsModal } from "./IndicatorsModal";
import { DepositModal } from "./DepositModal";
import { AiChartVisionModal } from "./AiChartVisionModal";
import { AiChatDrawer } from "./AiChatDrawer";
import { AutoTraderModal } from "./AutoTraderModal";
import { AiNeuralScannerOverlay } from "./AiNeuralScannerOverlay";
import { CenterSignalOverlay } from "./CenterSignalOverlay";
import { AccessGateModal } from "./AccessGateModal";
import { AdminPanelModal } from "./AdminPanelModal";
import { LogOut, Key, ShieldCheck } from "lucide-react";
import {
  Candle,
  TechnicalIndicators,
  AiAnalysisResult,
  TradeRecord,
  BankrollConfig,
  AutoTraderConfig,
  AutoTraderSession,
  AutoTradeLogItem,
  AccessSession,
} from "../types";
import { calculateAllIndicators } from "../utils/technicalIndicators";
import { soundManager } from "../utils/soundEffects";
import { fetchLiveCandles } from "../services/marketData";
import { requestAiAnalysis } from "../services/aiAnalysis";
import confetti from "canvas-confetti";

const INITIAL_BANKROLL_CONFIG: BankrollConfig = {
  initialBalance: 500,
  currentBalance: 500,
  currency: "USD",
  dailyStopWin: 100,
  dailyStopLoss: 50,
  baseStakePercent: 2,
  strategyMode: "SOROS",
  sorosLevel: 1,
};

const INITIAL_AUTOTRADER_CONFIG: AutoTraderConfig = {
  enabled: false,
  dailyStopWin: 100,
  dailyStopLoss: 50,
  stakeAmount: 10,
  minPayout: 85,
  timeframe: "1m",
  managementMode: "2x1",
  minAiConfidence: 78,
  soundAlerts: true,
};

const INITIAL_AUTOTRADER_SESSION: AutoTraderSession = {
  status: "IDLE",
  wins: 0,
  losses: 0,
  draws: 0,
  totalPnl: 0,
  tradesExecuted: 0,
  startedAt: Date.now(),
  history: [],
};

const INITIAL_TABS = [
  { id: "ETHUSDT", label: "ETH/USDT", type: "CRYPTO" },
  { id: "BTCUSDT", label: "BTC/USDT", type: "CRYPTO" },
  { id: "GBPUSD_OTC", label: "GBP/USD (OTC)", type: "FOREX OTC" },
];

interface CandleXWorkstationProps {
  user: any;
  token?: string;
  onLogout: () => void;
  onBackToAcademic?: () => void;
}

export const CandleXWorkstation: React.FC<CandleXWorkstationProps> = ({
  user,
  token,
  onLogout,
  onBackToAcademic,
}) => {
  const [activeTicker, setActiveTicker] = useState<string>("ETHUSDT");
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [protectionEnabled, setProtectionEnabled] = useState<boolean>(true);
  const [chartEngine, setChartEngine] = useState<
    "HIOVE_REAL" | "TRADINGVIEW"
  >("HIOVE_REAL");

  // Open asset tabs in top header
  const [openTabs, setOpenTabs] = useState(INITIAL_TABS);

  // Market & Indicators State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<string>("crosshair");

  // Indicator Overlays
  const [showEMAs, setShowEMAs] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showLevels, setShowLevels] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // Modals Visibility
  const [isOperationsOpen, setIsOperationsOpen] = useState<boolean>(false);
  const [isFinancialOpen, setIsFinancialOpen] = useState<boolean>(false);
  const [isCopyTraderOpen, setIsCopyTraderOpen] = useState<boolean>(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState<boolean>(false);
  const [isEconomicCalendarOpen, setIsEconomicCalendarOpen] = useState<boolean>(false);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isVisionOpen, setIsVisionOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAutoTraderOpen, setIsAutoTraderOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Hiove Access Validation Session
  const [accessSession, setAccessSession] = useState<AccessSession | null>(() => {
    try {
      const saved = localStorage.getItem("candlex_access_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthorized && parsed.email) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [isAccessGateOpen, setIsAccessGateOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("candlex_access_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthorized && parsed.email) {
          return false;
        }
      }
    } catch {}
    return true;
  });

  const handleAccessGranted = (session: AccessSession) => {
    setAccessSession(session);
    setIsAccessGateOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("candlex_access_session");
    localStorage.removeItem("candlex_admin_authenticated");
    setAccessSession(null);
    setIsAdminOpen(false);
    setIsAccessGateOpen(true);
  };

  // Observa validade da sessão para membros convencionais
  useEffect(() => {
    if (!accessSession?.isAuthorized || accessSession?.isAdmin) return;
    if (accessSession.expiresAt && accessSession.expiresAt <= Date.now()) {
      soundManager.playLossChime();
      alert(
        "Seu período de acesso ao CandleX AI expirou. Entre em contato com a administração para renovar seus dias."
      );
      handleLogout();
    }
  }, [accessSession]);

  // Auto Trader Config & Session
  const [autoTraderConfig, setAutoTraderConfig] = useState<AutoTraderConfig>(() => {
    try {
      const saved = localStorage.getItem("candlex_autotrader_config");
      return saved ? JSON.parse(saved) : INITIAL_AUTOTRADER_CONFIG;
    } catch {
      return INITIAL_AUTOTRADER_CONFIG;
    }
  });

  const [autoTraderSession, setAutoTraderSession] = useState<AutoTraderSession>(() => {
    try {
      const saved = localStorage.getItem("candlex_autotrader_session");
      return saved ? JSON.parse(saved) : INITIAL_AUTOTRADER_SESSION;
    } catch {
      return INITIAL_AUTOTRADER_SESSION;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("candlex_autotrader_config", JSON.stringify(autoTraderConfig));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [autoTraderConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("candlex_autotrader_session", JSON.stringify(autoTraderSession));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [autoTraderSession]);

  // Trades & Bankroll Management (persisted in localStorage)
  const [trades, setTrades] = useState<TradeRecord[]>(() => {
    try {
      const saved = localStorage.getItem("candlex_trades");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bankrollConfig, setBankrollConfig] = useState<BankrollConfig>(() => {
    try {
      const saved = localStorage.getItem("candlex_bankroll");
      return saved ? JSON.parse(saved) : INITIAL_BANKROLL_CONFIG;
    } catch {
      return INITIAL_BANKROLL_CONFIG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("candlex_trades", JSON.stringify(trades));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem("candlex_bankroll", JSON.stringify(bankrollConfig));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }, [bankrollConfig]);

  // Fetch Market Candles (100% Cloud via Binance / Bybit / Continuous Engine)
  const fetchMarketData = useCallback(async () => {
    try {
      const candlesData = await fetchLiveCandles(activeTicker, timeframe, 60);
      if (candlesData && Array.isArray(candlesData) && candlesData.length > 0) {
        setCandles(candlesData);
        const computed = calculateAllIndicators(candlesData);
        setIndicators(computed);
      }
    } catch (e) {
      console.warn("Market candle fetch error:", e);
    }
  }, [activeTicker, timeframe]);

  // Continuous market data polling
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2500);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const lastAnalysisTimeRef = React.useRef<number>(0);

  // Run AI Neural Analysis (100% Cloud Confluence & Institutional Engine)
  const runAiAnalysis = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastAnalysisTimeRef.current < 6000) {
      return; // Cooldown protection
    }
    if (candles.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    lastAnalysisTimeRef.current = now;

    try {
      const latestIndicators = indicators || calculateAllIndicators(candles);
      
      // Allow visual scan animation to run through all 6 pillars deeply (10s)
      const minScanDuration = new Promise((resolve) => setTimeout(resolve, 10000));
      
      const analysisPromise = requestAiAnalysis(activeTicker, timeframe, candles, latestIndicators);

      const [result] = await Promise.all([analysisPromise, minScanDuration]);

      if (result) {
        setAiAnalysis(result);

        // Audio notification on signal generation
        if (result.confidenceScore >= 70) {
          if (result.direction === "CALL") {
            soundManager.playCallAlert();
          } else if (result.direction === "PUT") {
            soundManager.playPutAlert();
          }
          soundManager.speakAlert(
            `Alerta CandleX: Análise concluída em ${activeTicker}. Assertividade ${result.confidenceScore}%. Aguardando confirmação aos 10 segundos.`
          );
        }
      }
    } catch (e) {
      console.error("AI Neural Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [candles, indicators, activeTicker, timeframe, isAnalyzing]);

  // Trigger analysis on ticker or timeframe switch
  useEffect(() => {
    setAiAnalysis(null);
    const delay = setTimeout(() => {
      runAiAnalysis(true);
    }, 500);
    return () => clearTimeout(delay);
  }, [activeTicker, timeframe]);

  // Auto-analysis recurrence every 50s
  useEffect(() => {
    const timer = setInterval(() => {
      runAiAnalysis(false);
    }, 50000);
    return () => clearInterval(timer);
  }, [runAiAnalysis]);

  // Add order to trade diary
  const handleRecordTrade = (
    tradeData: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">
  ) => {
    const newTrade: TradeRecord = {
      ...tradeData,
      id: "ord_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
      timestamp: Date.now(),
      result: "PENDING",
      pnl: 0,
    };
    setTrades((prev) => [newTrade, ...prev]);

    // Deduct stake from current balance
    setBankrollConfig((prev) => ({
      ...prev,
      currentBalance: Math.max(0, +(prev.currentBalance - tradeData.stake).toFixed(2)),
    }));
  };

  // Update trade result (WIN / LOSS / DRAW)
  const handleUpdateTradeResult = (
    id: string,
    result: "WIN" | "LOSS" | "DRAW"
  ) => {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        let pnl = 0;
        if (result === "WIN") {
          pnl = +((t.stake * t.payoutPercent) / 100).toFixed(2);
          // Credit profit + returned stake back to balance
          setBankrollConfig((b) => ({
            ...b,
            currentBalance: +(b.currentBalance + t.stake + pnl).toFixed(2),
          }));
        } else if (result === "LOSS") {
          pnl = -t.stake;
        }
        return {
          ...t,
          result,
          pnl,
        };
      })
    );
  };

  const handleClearTrades = () => {
    if (window.confirm("Deseja realmente limpar o histórico de ordens do diário?")) {
      setTrades([]);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  // Handle Tab Switch / Add / Close
  const handleSelectTab = (ticker: string) => {
    setActiveTicker(ticker);
  };

  const handleAddTab = () => {
    const all = [
      { id: "SOLUSDT", label: "SOL/USDT", type: "CRYPTO" },
      { id: "BNBUSDT", label: "BNB/USDT", type: "CRYPTO" },
      { id: "EURUSD_OTC", label: "EUR/USD (OTC)", type: "FOREX OTC" },
      { id: "USDJPY_OTC", label: "USD/JPY (OTC)", type: "FOREX OTC" },
    ];
    const available = all.find((a) => !openTabs.some((t) => t.id === a.id));
    if (available) {
      setOpenTabs((prev) => [...prev, available]);
      setActiveTicker(available.id);
    }
  };

  const handleCloseTab = (id: string) => {
    if (openTabs.length <= 1) return;
    const remaining = openTabs.filter((t) => t.id !== id);
    setOpenTabs(remaining);
    if (activeTicker === id) {
      setActiveTicker(remaining[0].id);
    }
  };

  // Add funds to bankroll
  const handleAddFunds = (amount: number) => {
    setBankrollConfig((prev) => ({
      ...prev,
      currentBalance: +(prev.currentBalance + amount).toFixed(2),
    }));
  };

  // Auto Trader Handlers & Automation Engine
  const AVAILABLE_ASSETS_MAP: Record<string, number> = {
    ETHUSDT: 89,
    BTCUSDT: 88,
    XRPUSDT: 89,
    SOLUSDT: 88,
    EURUSD_OTC: 91,
    AUDUSD_OTC: 90,
    EURGBP_OTC: 89,
    GBPCHF_OTC: 88,
    GBPJPY_OTC: 91,
    GBPUSD_OTC: 92,
    NZDUSD_OTC: 88,
    USDCAD_OTC: 89,
    USDCHF_OTC: 88,
    USDJPY_OTC: 90,
  };

  const handleToggleAutoTrader = () => {
    setAutoTraderConfig((prev) => {
      const nextEnabled = !prev.enabled;
      if (nextEnabled) {
        setAutoTraderSession((s) => ({
          ...s,
          status: s.status === "STOP_WIN" || s.status === "STOP_LOSS" ? "IDLE" : "RUNNING",
          startedAt: s.startedAt || Date.now(),
        }));
        soundManager.playOrderExecuted();
        soundManager.speakAlert(`Trader Auto ativado. Operações com gestão ${prev.managementMode}.`);
      } else {
        setAutoTraderSession((s) => ({
          ...s,
          status: s.status === "RUNNING" ? "PAUSED" : s.status,
        }));
      }
      return { ...prev, enabled: nextEnabled };
    });
  };

  const handleResetAutoTraderSession = () => {
    setAutoTraderSession({
      status: autoTraderConfig.enabled ? "RUNNING" : "IDLE",
      wins: 0,
      losses: 0,
      draws: 0,
      totalPnl: 0,
      tradesExecuted: 0,
      startedAt: Date.now(),
      history: [],
    });
  };

  const [lastAutoTradeTime, setLastAutoTradeTime] = useState<number>(0);

  // Auto Trader Automatic Execution Loop
  useEffect(() => {
    if (!autoTraderConfig.enabled || !aiAnalysis) return;
    if (autoTraderSession.status === "STOP_WIN" || autoTraderSession.status === "STOP_LOSS") return;

    if (aiAnalysis.confidenceScore < autoTraderConfig.minAiConfidence) return;
    if (aiAnalysis.direction !== "CALL" && aiAnalysis.direction !== "PUT") return;

    const now = Date.now();
    if (now - lastAutoTradeTime < 18000) return; // Cooldown between auto entries

    const activeAssetPayout = AVAILABLE_ASSETS_MAP[activeTicker] || 89;
    if (activeAssetPayout < autoTraderConfig.minPayout) return;

    if (bankrollConfig.currentBalance < autoTraderConfig.stakeAmount) {
      soundManager.speakAlert("Saldo insuficiente para entrada automática.");
      setAutoTraderConfig((c) => ({ ...c, enabled: false }));
      return;
    }

    setLastAutoTradeTime(now);

    const tradeId = "auto_" + Date.now();
    const stake = autoTraderConfig.stakeAmount;
    const direction = aiAnalysis.direction;
    const currentPriceAtEntry = candles[candles.length - 1]?.close || 0;
    const expiryMinutes = autoTraderConfig.timeframe === "5m" ? 5 : 1;

    // 1. Record Trade in Main Diary & Deduct Initial Stake
    handleRecordTrade({
      ticker: activeTicker,
      direction,
      entryPrice: currentPriceAtEntry,
      stake,
      payoutPercent: activeAssetPayout,
      expiryMinutes,
      strategyUsed: `Trader Auto IA (${autoTraderConfig.managementMode})`,
      confidenceAtEntry: aiAnalysis.confidenceScore,
      notes: `Gatilho Inteligente • Assertividade ${aiAnalysis.confidenceScore}% • Gestão ${autoTraderConfig.managementMode}`,
    });

    // 2. Add to Session Log
    const newLogItem: AutoTradeLogItem = {
      id: tradeId,
      timestamp: now,
      ticker: activeTicker,
      direction,
      stake,
      payoutPercent: activeAssetPayout,
      confidenceScore: aiAnalysis.confidenceScore,
      result: "PENDING",
      pnl: 0,
      timeframe: autoTraderConfig.timeframe.toUpperCase(),
      managementCycle: `Gestão ${autoTraderConfig.managementMode}`,
    };

    setAutoTraderSession((prev) => ({
      ...prev,
      status: "RUNNING",
      tradesExecuted: prev.tradesExecuted + 1,
      history: [newLogItem, ...prev.history],
    }));

    soundManager.playOrderExecuted();
    if (autoTraderConfig.soundAlerts) {
      soundManager.speakAlert(
        `Trader Auto: Entrada ${direction === "CALL" ? "de Compra" : "de Venda"} em ${activeTicker.replace("USDT", "").replace("_OTC", "")}.`
      );
    }

    // 3. Resolve Trade after realistic dynamic time
    const resolveTimeout = setTimeout(() => {
      const winProbability = Math.min(0.92, Math.max(0.68, aiAnalysis.confidenceScore / 100));
      const isWin = Math.random() < winProbability;
      const result: "WIN" | "LOSS" = isWin ? "WIN" : "LOSS";
      const profitPnl = isWin ? +((stake * activeAssetPayout) / 100).toFixed(2) : -stake;

      setAutoTraderSession((prev) => {
        const nextWins = isWin ? prev.wins + 1 : prev.wins;
        const nextLosses = !isWin ? prev.losses + 1 : prev.losses;
        const nextTotalPnl = +(prev.totalPnl + profitPnl).toFixed(2);

        let nextStatus: AutoTraderSession["status"] = "RUNNING";

        // Evaluate 2x1 Management
        if (autoTraderConfig.managementMode === "2x1") {
          if (nextWins >= 2) nextStatus = "STOP_WIN";
          else if (nextLosses >= 1) nextStatus = "STOP_LOSS";
        }
        // Evaluate 5x2 Management
        else if (autoTraderConfig.managementMode === "5x2") {
          if (nextWins >= 5) nextStatus = "STOP_WIN";
          else if (nextLosses >= 2) nextStatus = "STOP_LOSS";
        }

        // Evaluate Monetary Targets
        if (nextTotalPnl >= autoTraderConfig.dailyStopWin) {
          nextStatus = "STOP_WIN";
        } else if (nextTotalPnl <= -autoTraderConfig.dailyStopLoss) {
          nextStatus = "STOP_LOSS";
        }

        const updatedHistory = prev.history.map((h) =>
          h.id === tradeId ? { ...h, result, pnl: profitPnl } : h
        );

        if (nextStatus === "STOP_WIN") {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
          soundManager.playGoalReached();
          soundManager.speakAlert("Parabéns! Meta da Gestão batida com sucesso pelo Trader Auto!");
          setAutoTraderConfig((c) => ({ ...c, enabled: false }));
        } else if (nextStatus === "STOP_LOSS") {
          soundManager.speakAlert("Stop Loss atingido. Trader Auto pausado para blindar seu capital.");
          setAutoTraderConfig((c) => ({ ...c, enabled: false }));
        } else {
          if (isWin) soundManager.playWin();
        }

        return {
          ...prev,
          wins: nextWins,
          losses: nextLosses,
          totalPnl: nextTotalPnl,
          status: nextStatus,
          history: updatedHistory,
        };
      });

      if (isWin) {
        setBankrollConfig((b) => ({
          ...b,
          currentBalance: +(b.currentBalance + stake + profitPnl).toFixed(2),
        }));
      }
    }, 12000);

    return () => clearTimeout(resolveTimeout);
  }, [aiAnalysis, autoTraderConfig.enabled]);

  const currentPrice = candles[candles.length - 1]?.close || 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-slate-100 overflow-hidden font-sans select-none">
      {/* Main Trading Workstation */}
      <div className="flex-1 flex w-full overflow-hidden min-h-0">
        {/* 1. Left Neural Analyzer Sidebar */}
        <NeuralAnalyzerSidebar
          activeTicker={activeTicker}
          onSelectTicker={setActiveTicker}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          protectionEnabled={protectionEnabled}
          onToggleProtection={() => setProtectionEnabled(!protectionEnabled)}
          onGenerateAnalysis={runAiAnalysis}
          isAnalyzing={isAnalyzing}
          analysis={aiAnalysis}
          indicators={indicators}
          currentPrice={currentPrice}
          autoTraderConfig={autoTraderConfig}
          autoTraderSession={autoTraderSession}
          onToggleAutoTrader={handleToggleAutoTrader}
          onOpenAutoTraderModal={() => setIsAutoTraderOpen(true)}
          onLogout={handleLogout}
          isAdmin={Boolean(accessSession?.isAdmin)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Central Trading Chart Workstation with Hiove Real Traderoom & TradingView Live Engines */}
        <main className="flex-1 h-full min-h-0 bg-[#0B0E14] relative flex flex-col overflow-hidden">
          {/* Chart Engine Switcher Bar */}
          <div className="bg-[#0D111A] border-b border-[#1A2233] px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#1E2638]">
                <button
                  type="button"
                  id="btn-engine-hiove"
                  onClick={() => setChartEngine("HIOVE_REAL")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                    chartEngine === "HIOVE_REAL"
                      ? "bg-gradient-to-r from-[#FF7A00] to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(255,122,0,0.35)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hiove Oficial (Real)</span>
                </button>

                <button
                  type="button"
                  id="btn-engine-tradingview"
                  onClick={() => setChartEngine("TRADINGVIEW")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    chartEngine === "TRADINGVIEW"
                      ? "bg-[#1C2538] text-white border border-[#2D3B59]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>TradingView Pro</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                Ativo: <strong className="text-white">{activeTicker}</strong> &bull; {timeframe}
              </span>
              <button
                type="button"
                onClick={() => window.open(`https://app.hiove.com/traderoom?ticker=${activeTicker}`, "_blank")}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#141A26] hover:bg-[#1E2638] text-[11px] text-amber-400 border border-[#1E2638] cursor-pointer transition-colors"
                title="Abrir Hiove em Nova Guia"
              >
                <span>Abrir Hiove.com</span>
                <span className="text-[10px]">↗</span>
              </button>

              {/* Botão Painel ADM se for Administrador */}
              {accessSession?.isAdmin && (
                <button
                  type="button"
                  id="btn-header-admin-panel"
                  onClick={() => setIsAdminOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-[#FF7A00]/20 hover:from-amber-500/30 hover:to-[#FF7A00]/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                  title="Abrir Painel Administrativo de Membros"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Painel ADM</span>
                </button>
              )}

              {/* Badges de Sessão e Dias Restantes */}
              {accessSession?.email && (
                <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#121622] border border-[#1E2638] text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400 font-mono max-w-[120px] truncate">
                    {accessSession.email}
                  </span>
                  {accessSession.isAdmin ? (
                    <span className="text-[9.5px] font-bold text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/30">
                      ADM
                    </span>
                  ) : accessSession.expiresAt ? (
                    <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded border border-emerald-500/30">
                      {Math.max(
                        0,
                        Math.ceil((accessSession.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))
                      )}
                      d
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold text-amber-300 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/30">
                      VIP
                    </span>
                  )}
                </div>
              )}

              {/* BOTÃO PRINCIPAL SOLICITADO: Sair CandleX IA */}
              <button
                type="button"
                id="btn-logout-candlexia"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Sair do CandleX IA e voltar para a página de login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair CandleX IA</span>
              </button>
            </div>
          </div>

          {/* Active Chart View */}
          <div className="flex-1 w-full h-full min-h-0 relative">
            {chartEngine === "HIOVE_REAL" && (
              <HioveBrokerFrame
                activeTicker={activeTicker}
                onRecordTrade={handleRecordTrade}
                lastAiDirection={aiAnalysis?.direction}
                currentPrice={currentPrice}
              />
            )}

            {chartEngine === "TRADINGVIEW" && (
              <TradingViewRealChart
                ticker={activeTicker}
                interval={timeframe}
              />
            )}

            {/* Futuristic Holographic AI Scanner Overlay (Tendência, RSI, Volume, MACD, Médias Móveis, Fluxo) */}
            <AiNeuralScannerOverlay
              isScanning={isAnalyzing}
              activeTicker={activeTicker}
              timeframe={timeframe}
              indicators={indicators}
              candles={candles}
              analysis={aiAnalysis}
            />

            {/* Futuristic Holographic Center Signal HUD (Par de Moeda, Expiração, Assertividade, Confluências) */}
            <CenterSignalOverlay
              analysis={aiAnalysis}
              activeTicker={activeTicker}
              timeframe={timeframe}
              indicators={indicators}
              candles={candles}
              isAnalyzing={isAnalyzing}
              onReScan={() => runAiAnalysis(true)}
            />
          </div>
        </main>
      </div>

      {/* Interactive Modals */}
      <OperationsModal
        isOpen={isOperationsOpen}
        onClose={() => setIsOperationsOpen(false)}
        trades={trades}
        onUpdateTradeResult={handleUpdateTradeResult}
        onClearTrades={handleClearTrades}
      />

      <AutoTraderModal
        isOpen={isAutoTraderOpen}
        onClose={() => setIsAutoTraderOpen(false)}
        config={autoTraderConfig}
        onChangeConfig={setAutoTraderConfig}
        session={autoTraderSession}
        onResetSession={handleResetAutoTraderSession}
        onToggleEnabled={handleToggleAutoTrader}
      />

      <FinancialModal
        isOpen={isFinancialOpen}
        onClose={() => setIsFinancialOpen(false)}
        config={bankrollConfig}
        onSaveConfig={setBankrollConfig}
      />

      <CopyTraderModal
        isOpen={isCopyTraderOpen}
        onClose={() => setIsCopyTraderOpen(false)}
      />

      <DailyBonusModal
        isOpen={isDailyBonusOpen}
        onClose={() => setIsDailyBonusOpen(false)}
        onAddBalance={handleAddFunds}
      />

      <EconomicCalendarModal
        isOpen={isEconomicCalendarOpen}
        onClose={() => setIsEconomicCalendarOpen(false)}
      />

      <IndicatorsModal
        isOpen={isIndicatorsOpen}
        onClose={() => setIsIndicatorsOpen(false)}
        showEMAs={showEMAs}
        onToggleEMAs={() => setShowEMAs(!showEMAs)}
        showBollinger={showBollinger}
        onToggleBollinger={() => setShowBollinger(!showBollinger)}
        showLevels={showLevels}
        onToggleLevels={() => setShowLevels(!showLevels)}
        showVolume={showVolume}
        onToggleVolume={() => setShowVolume(!showVolume)}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onAddFunds={handleAddFunds}
      />

      {/* Print Vision Modal (Ctrl+V scanner) */}
      {isVisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl p-4 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm">CandleX AI Print Vision</h3>
              <button
                onClick={() => setIsVisionOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <AiChartVisionModal
              isEmbedded
              activeTicker={activeTicker}
              onClose={() => setIsVisionOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mentor Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl p-4 max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm">Mentor CandleX AI & Notificações</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <AiChatDrawer
              isEmbedded
              activeTicker={activeTicker}
              currentAnalysis={aiAnalysis}
              indicators={indicators}
            />
          </div>
        </div>
      )}

      {/* Access Gate Modal (Hiove VIP Access Check) */}
      <AccessGateModal
        isOpen={isAccessGateOpen || !accessSession?.isAuthorized}
        currentSession={accessSession}
        onAccessGranted={(session) => {
          handleAccessGranted(session);
          if (session.isAdmin) {
            setIsAdminOpen(true);
          }
        }}
        onLogout={handleLogout}
        canClose={Boolean(accessSession?.isAuthorized)}
        onClose={() => setIsAccessGateOpen(false)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Admin Master Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onAdminLoginDirect={handleAccessGranted}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default CandleXWorkstation;
