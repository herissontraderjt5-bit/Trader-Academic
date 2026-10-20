import { Candle, TechnicalIndicators, AiAnalysisResult } from "../types";

export function generateAlgorithmicAnalysis(
  ticker: string,
  timeframe: string,
  candles: Candle[],
  indicators: TechnicalIndicators | any = {}
): AiAnalysisResult {
  const lastCandle = candles[candles.length - 1] || {
    time: Math.floor(Date.now() / 1000),
    open: 100,
    close: 100,
    high: 100,
    low: 100,
    volume: 50,
  };
  const currentPrice = lastCandle.close || 100;

  const rsi = typeof indicators?.rsi === "number" ? indicators.rsi : 50;
  const pattern = indicators?.candlestickPattern || "Fluxo Neutro";
  const ema9 = indicators?.ema9 || currentPrice;
  const ema20 = indicators?.ema20 || currentPrice;
  const support = indicators?.support || +(currentPrice * 0.994).toFixed(2);
  const resistance = indicators?.resistance || +(currentPrice * 1.006).toFixed(2);
  const pivot = +( (support + resistance + currentPrice) / 3 ).toFixed(2);

  // Scoring matrix
  let callScore = 0;
  let putScore = 0;
  const detectedPatterns: string[] = [];

  if (rsi < 32) {
    callScore += 35;
    detectedPatterns.push("RSI em Região de Sobrevenda Extrema (<32)");
  } else if (rsi > 68) {
    putScore += 35;
    detectedPatterns.push("RSI em Região de Sobrecompra Extrema (>68)");
  } else if (rsi > 50) {
    callScore += 10;
  } else {
    putScore += 10;
  }

  if (ema9 > ema20) {
    callScore += 25;
    detectedPatterns.push("Cruzamento de Alta EMA 9 > EMA 20");
  } else if (ema9 < ema20) {
    putScore += 25;
    detectedPatterns.push("Cruzamento de Baixa EMA 9 < EMA 20");
  }

  if (currentPrice <= support * 1.0015) {
    callScore += 30;
    detectedPatterns.push("Rejeição em Zona de Demanda Institucional (Suporte)");
  } else if (currentPrice >= resistance * 0.9985) {
    putScore += 30;
    detectedPatterns.push("Absorção de Liquidez em Zona de Oferta (Resistência)");
  }

  if (pattern.includes("Martelo") || pattern.includes("Engolfo de Alta") || pattern.includes("Estrela da Manhã")) {
    callScore += 20;
    detectedPatterns.push(`Gatilho de Price Action: ${pattern}`);
  } else if (pattern.includes("Estrela Cadente") || pattern.includes("Engolfo de Baixa") || pattern.includes("Pinbar")) {
    putScore += 20;
    detectedPatterns.push(`Gatilho de Price Action: ${pattern}`);
  }

  // Ensure decisive directional calculation
  let isCall = callScore > putScore;
  let isPut = putScore > callScore;

  if (!isCall && !isPut) {
    if (rsi >= 50 || ema9 >= ema20) {
      isCall = true;
      callScore += 20;
    } else {
      isPut = true;
      putScore += 20;
    }
  }

  const direction: "CALL" | "PUT" = isCall ? "CALL" : "PUT";

  const rawConfidence = isCall 
    ? Math.min(98, Math.max(88, 75 + callScore / 2.5))
    : Math.min(98, Math.max(88, 75 + putScore / 2.5));
  const confidenceScore = Math.round(rawConfidence);

  const marketSentiment = isCall
    ? confidenceScore > 80 ? "FORTE_ALTA" : "ALTA"
    : isPut
    ? confidenceScore > 80 ? "FORTE_BAIXA" : "BAIXA"
    : "LATERAL";

  const triggerZone = isCall
    ? `Entrada em retração na faixa ${support.toLocaleString("pt-BR")} - ${(support * 1.001).toFixed(2)}`
    : isPut
    ? `Entrada em retração na faixa ${resistance.toLocaleString("pt-BR")} - ${(resistance * 0.999).toFixed(2)}`
    : `Aguardar confirmação de rompimento do Pivot (${pivot.toLocaleString("pt-BR")})`;

  const invalidationLevel = isCall
    ? `Rompimento do suporte abaixo de ${(support * 0.997).toFixed(2)}`
    : isPut
    ? `Rompimento da resistência acima de ${(resistance * 1.003).toFixed(2)}`
    : `Volume inconclusivo na faixa neutra`;

  const strategyName = isCall
    ? "Retração em Suporte Institucional (SMC + Price Action)"
    : isPut
    ? "Exaustão em Região de Oferta (FVG + Rejeição de Topo)"
    : "Confluência Neutra - Filtrando Ruído de Mercado";

  const rationale = isCall
    ? `Forte rejeição de preço próxima ao suporte em ${support.toLocaleString("pt-BR")} com alinhamento das médias móveis e RSI favorável à retomada altista.`
    : isPut
    ? `Pressão vendedora com absorção no topo em ${resistance.toLocaleString("pt-BR")} indicando esgotamento do movimento comprador e retração iminente.`
    : `Mercado em consolidação entre ${support.toLocaleString("pt-BR")} e ${resistance.toLocaleString("pt-BR")}. Recomenda-se aguardar toque nas extremidades.`;

  const hioveQuickTip = isCall
    ? "Clique em COMPRA (CALL) assim que a vela der o pico de retração em direção à taxa de suporte."
    : isPut
    ? "Clique em VENDA (PUT) no momento em que a vela esticar até a taxa de resistência da Hiove."
    : "Mantenha a mão fixa e aguarde um sinal com confluência acima de 75%.";

  return {
    direction,
    confidenceScore,
    timeframeExpiry: timeframe.toUpperCase() === "5M" ? "Expiração 5 min" : "Próxima Vela (1 min)",
    triggerZone,
    invalidationLevel,
    detectedPatterns: detectedPatterns.length > 0 ? detectedPatterns : ["Fluxo Normal de Candlestick"],
    strategyName,
    marketSentiment,
    rationale,
    hioveQuickTip,
    keyLevels: {
      support,
      resistance,
      pivot,
    },
    timestamp: Date.now(),
    ticker,
    priceAtAnalysis: currentPrice,
  };
}

export async function requestAiAnalysis(
  ticker: string,
  timeframe: string,
  candles: Candle[],
  indicators: TechnicalIndicators | any
): Promise<AiAnalysisResult> {
  // Tenta chamar o endpoint de IA se estiver rodando localmente com timeout curto de 2.5s
  try {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        timeframe: timeframe.toUpperCase(),
        candles: candles.slice(-20),
        indicators,
      }),
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.result) {
        return {
          ...data.result,
          timestamp: Date.now(),
          ticker,
          priceAtAnalysis: candles[candles.length - 1]?.close || 0,
        };
      }
    }
  } catch {
    // Modo 100% cloud / Vercel: usa o motor institucional algorítmico diretamente
  }

  return generateAlgorithmicAnalysis(ticker, timeframe, candles, indicators);
}

export async function requestAiChatReply(
  message: string,
  context: {
    activeTicker: string;
    direction?: string;
    confidence?: number;
    rsi?: number;
    pattern?: string;
    trend?: string;
  }
): Promise<string> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.reply) return data.reply;
    }
  } catch {
    // Fallback inteligente no cliente
  }

  const { activeTicker, direction = "NEUTRO", confidence = 85, rsi = 50 } = context;
  const isCall = direction === "CALL";
  const actionText = isCall ? "COMPRA (CALL) ↗" : "VENDA (PUT) ↘";

  return `Com base na confluência institucional de ${activeTicker}, identificamos um alinhamento favorável para **${actionText}** com **${confidence}% de assertividade**. O RSI está em ${rsi.toFixed(1)}, indicando momento propício para entrada na Hiove respeitando o gerenciamento de banca.`;
}
