export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiStatus: "Sobrecompra" | "Sobrevenda" | "Neutro";
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  stochK: number;
  stochD: number;
  ema9: number;
  ema20: number;
  sma50: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  support: number;
  resistance: number;
  candlestickPattern: string;
  trend: "ALTA" | "BAIXA" | "LATERAL";
}

export interface AiAnalysisResult {
  direction: "CALL" | "PUT" | "NEUTRAL";
  confidenceScore: number;
  timeframeExpiry: string;
  triggerZone: string;
  invalidationLevel: string;
  detectedPatterns: string[];
  strategyName: string;
  marketSentiment: "FORTE_ALTA" | "ALTA" | "LATERAL" | "BAIXA" | "FORTE_BAIXA";
  rationale: string;
  hioveQuickTip: string;
  keyLevels: {
    support: number;
    resistance: number;
    pivot: number;
  };
  timestamp?: number;
  ticker?: string;
  priceAtAnalysis?: number;
}

export interface VisionAnalysisResult {
  direction: "CALL" | "PUT" | "NEUTRAL";
  confidenceScore: number;
  detectedVisualPatterns: string[];
  trendAnalysis: string;
  keyZonesIdentified: string;
  recommendedAction: string;
  executionTimeframe: string;
}

export interface TradeRecord {
  id: string;
  timestamp: number;
  ticker: string;
  direction: "CALL" | "PUT";
  entryPrice: number;
  stake: number;
  payoutPercent: number;
  expiryMinutes: number;
  result: "WIN" | "LOSS" | "PENDING" | "DRAW";
  pnl: number;
  strategyUsed: string;
  confidenceAtEntry: number;
  notes?: string;
}

export interface TickerSummary {
  ticker: string;
  price: number;
  priceChangePercent: number;
  high: number;
  low: number;
  volume: number;
}

export interface BankrollConfig {
  initialBalance: number;
  currentBalance: number;
  currency: "USD" | "BRL";
  dailyStopWin: number;
  dailyStopLoss: number;
  baseStakePercent: number; // e.g. 2%
  strategyMode: "FIXED" | "SOROS";
  sorosLevel: number;
}

export interface AutoTraderConfig {
  enabled: boolean;
  dailyStopWin: number; // Meta diária de lucro (ex: 100)
  dailyStopLoss: number; // Stop loss diário (ex: 50)
  stakeAmount: number; // Valor de entrada (ex: 10)
  minPayout: number; // Payout mínimo (ex: 85)
  timeframe: "1m" | "5m"; // Time das operações: M1 ou M5
  managementMode: "2x1" | "5x2"; // Selecionar qual gestão: 2x1 ou 5x2
  minAiConfidence: number; // Assertividade mínima da IA (ex: 78%)
  soundAlerts: boolean;
}

export interface AutoTradeLogItem {
  id: string;
  timestamp: number;
  ticker: string;
  direction: "CALL" | "PUT";
  stake: number;
  payoutPercent: number;
  confidenceScore: number;
  result: "WIN" | "LOSS" | "PENDING" | "DRAW";
  pnl: number;
  timeframe: string;
  managementCycle: string;
  reason?: string;
}

export interface AutoTraderSession {
  status: "IDLE" | "RUNNING" | "STOP_WIN" | "STOP_LOSS" | "PAUSED";
  wins: number;
  losses: number;
  draws: number;
  totalPnl: number;
  tradesExecuted: number;
  startedAt: number;
  history: AutoTradeLogItem[];
}

export type ActiveWindowId =
  | "hiove"
  | "ai"
  | "chart"
  | "performance"
  | "vision"
  | "chat"
  | "multi";

export type MultiLayoutMode = "split-50" | "broker-wide" | "ai-wide" | "tri-pane" | "quad-grid";

export interface AccessSession {
  email: string;
  isAuthorized: boolean;
  isAdmin?: boolean;
  expiresAt?: number | null;
  validatedAt: number;
}

export interface ClientRecord {
  email: string;
  firstLoginAt: number;
  lastLoginAt: number;
  expiresAt: number | null; // null = Lifetime / Vitalício
  status: "ACTIVE" | "EXPIRED" | "BLOCKED";
  registeredVia: "HIOVE" | "ADMIN_MANUAL" | "ADMIN_MASTER";
  notes?: string;
}
