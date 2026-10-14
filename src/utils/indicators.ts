import { KLineBar, TechnicalIndicators, CustomRules, TrendDirection } from '../types/stock';

export const DEFAULT_CUSTOM_RULES: CustomRules = {
  squeezeThreshold: 1.8, // 1.8%
  bollStdDev: 2.0,
  kdGoldenCrossLookback: 2,
  require60MAUpward: true,
  dailyTargetNTD: 500,
  brokerFeeDiscount: 0.28, // 28折 (一般券商電子單約2.8折)
  customNotes: '季線為多空生命線，均線糾結壓縮小於1.8%時為變盤關鍵點。00632R為獨立避險對沖工具。',
};

// Calculate Simple Moving Average for a specific lookback period
export function calculateSMA(closes: number[], period: number): number {
  if (closes.length < period) {
    if (closes.length === 0) return 0;
    return closes.reduce((a, b) => a + b, 0) / closes.length;
  }
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Calculate MA slope over lookback bars (default 3 bars)
export function calculateSlope(maHistory: number[]): TrendDirection {
  if (maHistory.length < 2) return '持平 ━';
  const latest = maHistory[maHistory.length - 1];
  const previous = maHistory[Math.max(0, maHistory.length - 4)]; // 3 bars back
  const delta = (latest - previous) / (previous || 1);

  if (delta > 0.0008) return '翻揚 ▲';
  if (delta < -0.0008) return '下彎 ▼';
  return '持平 ━';
}

// Calculate KD(9, 3, 3)
export function calculateKD(bars: KLineBar[], period = 9): { k: number; d: number; kHistory: number[]; dHistory: number[] } {
  let k = 50;
  let d = 50;
  const kHistory: number[] = [];
  const dHistory: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    const startIdx = Math.max(0, i - period + 1);
    const window = bars.slice(startIdx, i + 1);
    
    let high = -Infinity;
    let low = Infinity;
    for (const b of window) {
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
    }

    const close = bars[i].close;
    let rsv = 50;
    if (high !== low) {
      rsv = ((close - low) / (high - low)) * 100;
    }

    k = (2 / 3) * k + (1 / 3) * rsv;
    d = (2 / 3) * d + (1 / 3) * k;

    kHistory.push(k);
    dHistory.push(d);
  }

  return { k, d, kHistory, dHistory };
}

// Calculate MACD(12, 26, 9)
export function calculateMACD(closes: number[]): { dif: number; dem: number; osc: number; oscHistory: number[] } {
  if (closes.length === 0) return { dif: 0, dem: 0, osc: 0, oscHistory: [] };

  const ema12 = calculateEMAArray(closes, 12);
  const ema26 = calculateEMAArray(closes, 26);

  const difArray: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    difArray.push(ema12[i] - ema26[i]);
  }

  const demArray = calculateEMAArray(difArray, 9);
  const oscHistory: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    oscHistory.push(difArray[i] - demArray[i]);
  }

  const lastIdx = closes.length - 1;
  return {
    dif: difArray[lastIdx],
    dem: demArray[lastIdx],
    osc: oscHistory[lastIdx],
    oscHistory,
  };
}

// Helper: Calculate EMA array
function calculateEMAArray(values: number[], period: number): number[] {
  const result: number[] = [];
  if (values.length === 0) return result;

  const multiplier = 2 / (period + 1);
  let ema = values[0];
  result.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = (values[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

// Calculate Bollinger Bands(20, stdDevMult)
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2.0) {
  const mid = calculateSMA(closes, period);
  const slice = closes.slice(-period);
  const count = slice.length || 1;
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - mid, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  const upper = mid + multiplier * stdDev;
  const lower = mid - multiplier * stdDev;
  const bandwidth = mid > 0 ? ((upper - lower) / mid) * 100 : 0;

  return { upper, mid, lower, bandwidth };
}

// Compute all quantitative indicators for a series of bars
export function computeIndicators(bars: KLineBar[], currentPrice: number, rules: CustomRules = DEFAULT_CUSTOM_RULES): TechnicalIndicators {
  if (!bars || bars.length === 0) {
    return {
      ma5: currentPrice,
      ma10: currentPrice,
      ma20: currentPrice,
      ma60: currentPrice,
      squeeze: 0,
      maSlope20: '持平 ━',
      maSlope60: '持平 ━',
      k: 50,
      d: 50,
      dif: 0,
      dem: 0,
      macdOsc: 0,
      bollUpper: currentPrice * 1.05,
      bollMid: currentPrice,
      bollLower: currentPrice * 0.95,
      bandwidth: 10,
      isBreakout: false,
      isMomentumBull: false,
      isBollBreakout: false,
      kdCross: 'none',
      macdStatus: '平盤',
    };
  }

  // Create closes array with latest current price replacing or appending
  const closes = bars.map((b) => b.close);
  // If current price differs from last bar close, update the last element for real-time reactivity
  if (closes.length > 0) {
    closes[closes.length - 1] = currentPrice;
  }

  const ma5 = calculateSMA(closes, 5);
  const ma10 = calculateSMA(closes, 10);
  const ma20 = calculateSMA(closes, 20);
  const ma60 = calculateSMA(closes, 60);

  // Historical MA series for slopes
  const ma20History: number[] = [];
  const ma60History: number[] = [];
  for (let i = Math.max(0, closes.length - 10); i < closes.length; i++) {
    ma20History.push(calculateSMA(closes.slice(0, i + 1), 20));
    ma60History.push(calculateSMA(closes.slice(0, i + 1), 60));
  }

  const maSlope20 = calculateSlope(ma20History);
  const maSlope60 = calculateSlope(ma60History);

  // Squeeze calculation: ((Max(5,10,20) - Min(5,10,20)) / Min) * 100%
  const minMA = Math.min(ma5, ma10, ma20);
  const maxMA = Math.max(ma5, ma10, ma20);
  const squeeze = minMA > 0 ? ((maxMA - minMA) / minMA) * 100 : 0;

  // Breakout: Squeeze <= threshold && current price breaks above the highest of 5/10/20MA
  const isBreakout = squeeze <= rules.squeezeThreshold && currentPrice > maxMA;

  // KD calculation
  const kd = calculateKD(bars, 9);
  const k = kd.k;
  const d = kd.d;

  let kdCross: 'golden' | 'death' | 'none' = 'none';
  const kHist = kd.kHistory;
  const dHist = kd.dHistory;
  const len = kHist.length;

  if (len >= 2) {
    const curK = kHist[len - 1];
    const curD = dHist[len - 1];
    const prevK = kHist[len - 2];
    const prevD = dHist[len - 2];

    if (curK > curD && prevK <= prevD) {
      kdCross = 'golden';
    } else if (curK < curD && prevK >= prevD) {
      kdCross = 'death';
    } else if (curK > curD) {
      // Check if golden cross occurred within the lookback window
      const lookback = rules.kdGoldenCrossLookback || 2;
      for (let offset = 2; offset <= Math.min(lookback + 1, len - 1); offset++) {
        if (kHist[len - offset] <= dHist[len - offset]) {
          kdCross = 'golden';
          break;
        }
      }
    }
  }

  // MACD calculation
  const macd = calculateMACD(closes);
  const osc = macd.osc;
  const oscHist = macd.oscHistory;
  let macdStatus: '翻紅' | '綠柱縮腳' | '翻綠' | '紅柱縮腳' | '平盤' = '平盤';

  if (oscHist.length >= 2) {
    const prevOsc = oscHist[oscHist.length - 2];
    if (osc >= 0) {
      if (prevOsc < 0) macdStatus = '翻紅';
      else if (osc >= prevOsc) macdStatus = '翻紅';
      else macdStatus = '紅柱縮腳';
    } else {
      if (prevOsc >= 0) macdStatus = '翻綠';
      else if (osc > prevOsc) macdStatus = '綠柱縮腳';
      else macdStatus = '翻綠';
    }
  }

  // Momentum Bull signal:
  // 60MA upward (if required by rule) AND (KD golden cross OR MACD green bar shrinking or turning red)
  const is60MAValid = rules.require60MAUpward ? maSlope60 === '翻揚 ▲' : true;
  const isMomentumBull =
    is60MAValid &&
    (kdCross === 'golden' || macdStatus === '翻紅' || macdStatus === '綠柱縮腳');

  // Bollinger Bands
  const boll = calculateBollingerBands(closes, 20, rules.bollStdDev);
  const isBollBreakout = currentPrice >= boll.upper;

  return {
    ma5,
    ma10,
    ma20,
    ma60,
    squeeze,
    maSlope20,
    maSlope60,
    k,
    d,
    dif: macd.dif,
    dem: macd.dem,
    macdOsc: osc,
    bollUpper: boll.upper,
    bollMid: boll.mid,
    bollLower: boll.lower,
    bandwidth: boll.bandwidth,
    isBreakout,
    isMomentumBull,
    isBollBreakout,
    kdCross,
    macdStatus,
  };
}
