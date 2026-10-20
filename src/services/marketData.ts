import { Candle } from "../types";

// In-memory price state for ultra-smooth realistic continuity
const clientPriceCache: Record<string, { lastPrice: number; lastUpdate: number; candles: Candle[] }> = {};

export async function fetchLiveCandles(
  ticker: string,
  timeframe: string,
  limit: number = 60
): Promise<Candle[]> {
  const cleanTicker = ticker.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const interval = timeframe.toLowerCase() === "5m" ? "5m" : "1m";

  // Check if it's a crypto pair that Binance / Bybit has
  const isCrypto =
    cleanTicker.includes("BTC") ||
    cleanTicker.includes("ETH") ||
    cleanTicker.includes("SOL") ||
    cleanTicker.includes("XRP") ||
    cleanTicker.includes("BNB") ||
    cleanTicker.includes("DOGE");

  if (isCrypto) {
    const symbol = cleanTicker.endsWith("USDT") ? cleanTicker : `${cleanTicker}USDT`;
    const binanceUrls = [
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    ];

    for (const url of binanceUrls) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            const candles: Candle[] = raw.map((item: any) => ({
              time: Math.floor(item[0] / 1000),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            }));

            clientPriceCache[cleanTicker] = {
              lastPrice: candles[candles.length - 1].close,
              lastUpdate: Date.now(),
              candles,
            };

            return candles;
          }
        }
      } catch {
        // Continue to next source
      }
    }
  }

  // Realistic synthetic continuity generator for OTC pairs (Forex, etc.) or when offline
  const now = Math.floor(Date.now() / 1000);
  let basePrice = cleanTicker.includes("ETH")
    ? 2680.0
    : cleanTicker.includes("BTC")
    ? 93400.0
    : cleanTicker.includes("SOL")
    ? 188.0
    : cleanTicker.includes("XRP")
    ? 2.45
    : cleanTicker.includes("EUR")
    ? 1.085
    : cleanTicker.includes("GBP")
    ? 1.295
    : 100.0;

  if (clientPriceCache[cleanTicker]?.lastPrice) {
    basePrice = clientPriceCache[cleanTicker].lastPrice;
  }

  const intervalSeconds = interval === "5m" ? 300 : 60;
  const isForex = cleanTicker.includes("EUR") || cleanTicker.includes("GBP") || cleanTicker.includes("USD") || cleanTicker.includes("OTC");
  const precision = isForex ? 5 : 2;

  const candles: Candle[] = [];
  let currentClose = basePrice;

  for (let i = limit - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    const volatility = isForex ? 0.0004 : 0.0025;
    const delta = (Math.random() - 0.495) * (basePrice * volatility);
    const open = currentClose;
    const close = +(open + delta).toFixed(precision);
    const spread = Math.abs(close - open);
    const high = +(Math.max(open, close) + Math.random() * (spread + basePrice * (volatility * 0.4))).toFixed(precision);
    const low = +(Math.min(open, close) - Math.random() * (spread + basePrice * (volatility * 0.4))).toFixed(precision);
    const volume = +(Math.random() * 40 + 15).toFixed(2);
    candles.push({ time, open, high, low, close, volume });
    currentClose = close;
  }

  clientPriceCache[cleanTicker] = {
    lastPrice: candles[candles.length - 1].close,
    lastUpdate: Date.now(),
    candles,
  };

  return candles;
}
