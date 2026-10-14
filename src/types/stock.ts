export interface KLineBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendDirection = '翻揚 ▲' | '下彎 ▼' | '持平 ━';

export interface TechnicalIndicators {
  ma5: number;
  ma10: number;
  ma20: number;
  ma60: number;
  squeeze: number; // ((Max(5,10,20) - Min(5,10,20)) / Min) * 100%
  maSlope20: TrendDirection;
  maSlope60: TrendDirection;
  k: number;
  d: number;
  dif: number;
  dem: number;
  macdOsc: number; // Histogram DIF - DEM
  bollUpper: number;
  bollMid: number;
  bollLower: number;
  bandwidth: number; // ((Upper - Lower) / Mid) * 100%
  // Signals
  isBreakout: boolean; // Squeeze <= threshold && price > max(ma5, ma10, ma20)
  isMomentumBull: boolean; // 60MA upward && (KD golden cross || MACD turning red/expanding)
  isBollBreakout: boolean; // price >= bollUpper
  kdCross: 'golden' | 'death' | 'none';
  macdStatus: '翻紅' | '綠柱縮腳' | '翻綠' | '紅柱縮腳' | '平盤';
}

export interface StockQuote {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number; // in shares or lots (張)
  previousClose: number;
  isHedging?: boolean; // Force true for 00632R.TW
  history: KLineBar[];
  indicators: TechnicalIndicators;
  aiDiagnosis?: AIDiagnosis;
}

export interface AIDiagnosis {
  summary: string; // 80 chars max
  stance: '強勢進攻' | '糾結突破' | '動能翻多' | '區間震盪' | '偏弱偏空' | '獨立避險';
  defensePrice: number;
  confidence: number;
  timestamp: string;
  source?: 'gemini-3.8-flash' | 'rule-based';
}

export interface BatchDiagnosisResult {
  marketOverview: string;
  actionPlan: string;
  topPicks: string[];
  timestamp: string;
}

export interface CustomRules {
  squeezeThreshold: number; // default 1.8%
  bollStdDev: number; // default 2.0
  kdGoldenCrossLookback: number; // default 2
  require60MAUpward: boolean; // default true
  dailyTargetNTD: number; // default 500
  brokerFeeDiscount: number; // default 0.28 (28折)
  customNotes: string;
}

export type AppMode = 'intraday' | 'afterhours';
