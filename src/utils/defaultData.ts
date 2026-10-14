import { StockQuote, KLineBar } from '../types/stock';
import { computeIndicators, DEFAULT_CUSTOM_RULES } from './indicators';

// Generate 90 daily bars leading up to recent trading date
function generateHistoricalBars(
  basePrice: number,
  volatility: number,
  trendBias: number,
  days = 90
): { bars: KLineBar[]; currentPrice: number; prevClose: number } {
  const bars: KLineBar[] = [];
  let price = basePrice;
  const now = new Date();
  
  // Deterministic seed for reproducible realistic curves
  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const dateStr = d.toISOString().split('T')[0];
    const wave = Math.sin((days - i) * 0.12) * volatility * 0.8;
    const noise = (Math.sin((days - i) * 1.7) + Math.cos((days - i) * 0.9)) * 0.5 * volatility;
    const delta = wave + noise + trendBias;

    const open = Math.round((price + (Math.sin(i) * 0.3 * volatility)) * 100) / 100;
    const close = Math.max(1, Math.round((price + delta) * 100) / 100);
    const high = Math.round((Math.max(open, close) + Math.abs(Math.sin(i * 2)) * volatility * 0.6) * 100) / 100;
    const low = Math.round((Math.min(open, close) - Math.abs(Math.cos(i * 3)) * volatility * 0.6) * 100) / 100;
    const volume = Math.round(15000 + Math.abs(Math.sin(i * 0.5)) * 45000);

    bars.push({
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  const currentPrice = bars[bars.length - 1].close;
  const prevClose = bars.length >= 2 ? bars[bars.length - 2].close : currentPrice;

  return { bars, currentPrice, prevClose };
}

export function createInitialWatchlist(): StockQuote[] {
  // 1. 2330.TW 台積電 (強勢權值股，均線糾結後向上發動)
  const tsmc = generateHistoricalBars(1015, 12, 0.45, 90);
  // Ensure recent bars create tight squeeze then breakout
  const tsmcBars = [...tsmc.bars];
  const tsmcPrice = 1045;
  const tsmcPrev = 1030;
  tsmcBars[tsmcBars.length - 1].close = tsmcPrice;

  // 2. 2317.TW 鴻海 (高檔整理震盪)
  const honhai = generateHistoricalBars(212, 3.2, 0.15, 90);
  const honhaiPrice = 221.5;
  const honhaiPrev = 219.0;
  honhai.bars[honhai.bars.length - 1].close = honhaiPrice;

  // 3. 2454.TW 聯發科 (動能加溫)
  const mtk = generateHistoricalBars(1310, 18, 0.6, 90);
  const mtkPrice = 1385;
  const mtkPrev = 1360;
  mtk.bars[mtk.bars.length - 1].close = mtkPrice;

  // 4. 0050.TW 元大台灣50 (權值型ETF)
  const etf0050 = generateHistoricalBars(188, 2.1, 0.2, 90);
  const etf0050Price = 196.2;
  const etf0050Prev = 194.5;
  etf0050.bars[etf0050.bars.length - 1].close = etf0050Price;

  // 5. ^TWII 加權指數 (大盤指數基準)
  const twii = generateHistoricalBars(22800, 180, 12, 90);
  const twiiPrice = 23650;
  const twiiPrev = 23480;
  twii.bars[twii.bars.length - 1].close = twiiPrice;

  // 6. 00632R.TW 元大台灣50反1 (【強制排除多頭標的，獨立避險部位】)
  const etf00632R = generateHistoricalBars(3.65, 0.04, -0.003, 90);
  const rPrice = 3.38;
  const rPrev = 3.41;
  etf00632R.bars[etf00632R.bars.length - 1].close = rPrice;

  const rawList: Omit<StockQuote, 'indicators'>[] = [
    {
      symbol: '2330.TW',
      name: '台積電',
      category: '半導體權值',
      price: tsmcPrice,
      change: Math.round((tsmcPrice - tsmcPrev) * 100) / 100,
      changePercent: Math.round(((tsmcPrice - tsmcPrev) / tsmcPrev) * 10000) / 100,
      open: 1035,
      high: 1050,
      low: 1030,
      volume: 38240,
      previousClose: tsmcPrev,
      history: tsmcBars,
      isHedging: false,
    },
    {
      symbol: '2317.TW',
      name: '鴻海',
      category: 'AI伺服器/電子',
      price: honhaiPrice,
      change: Math.round((honhaiPrice - honhaiPrev) * 100) / 100,
      changePercent: Math.round(((honhaiPrice - honhaiPrev) / honhaiPrev) * 10000) / 100,
      open: 220.0,
      high: 223.0,
      low: 219.0,
      volume: 52180,
      previousClose: honhaiPrev,
      history: honhai.bars,
      isHedging: false,
    },
    {
      symbol: '2454.TW',
      name: '聯發科',
      category: 'IC設計',
      price: mtkPrice,
      change: Math.round((mtkPrice - mtkPrev) * 100) / 100,
      changePercent: Math.round(((mtkPrice - mtkPrev) / mtkPrev) * 10000) / 100,
      open: 1365,
      high: 1395,
      low: 1360,
      volume: 6840,
      previousClose: mtkPrev,
      history: mtk.bars,
      isHedging: false,
    },
    {
      symbol: '0050.TW',
      name: '元大台灣50',
      category: '市值型ETF',
      price: etf0050Price,
      change: Math.round((etf0050Price - etf0050Prev) * 100) / 100,
      changePercent: Math.round(((etf0050Price - etf0050Prev) / etf0050Prev) * 10000) / 100,
      open: 195.0,
      high: 196.8,
      low: 194.5,
      volume: 18450,
      previousClose: etf0050Prev,
      history: etf0050.bars,
      isHedging: false,
    },
    {
      symbol: '^TWII',
      name: '加權指數',
      category: '大盤基準',
      price: twiiPrice,
      change: Math.round((twiiPrice - twiiPrev) * 100) / 100,
      changePercent: Math.round(((twiiPrice - twiiPrev) / twiiPrev) * 10000) / 100,
      open: 23510,
      high: 23715,
      low: 23490,
      volume: 384000,
      previousClose: twiiPrev,
      history: twii.bars,
      isHedging: false,
    },
    {
      symbol: '00632R.TW',
      name: '元大台灣50反1',
      category: '獨立避險部位',
      price: rPrice,
      change: Math.round((rPrice - rPrev) * 100) / 100,
      changePercent: Math.round(((rPrice - rPrev) / rPrev) * 10000) / 100,
      open: 3.40,
      high: 3.42,
      low: 3.37,
      volume: 98400,
      previousClose: rPrev,
      history: etf00632R.bars,
      isHedging: true, // MANDATORY: Independent hedging position
    },
  ];

  return rawList.map((item) => ({
    ...item,
    indicators: computeIndicators(item.history, item.price, DEFAULT_CUSTOM_RULES),
  }));
}

// Tick calculation helper for Taiwan stock market
export function getTickSize(price: number): number {
  if (price < 10) return 0.01;
  if (price < 50) return 0.05;
  if (price < 100) return 0.1;
  if (price < 500) return 0.5;
  if (price < 1000) return 1.0;
  return 5.0;
}

// "Daily 500 NTD Target" strategy calculator
export interface Daily500Result {
  symbol: string;
  name: string;
  currentPrice: number;
  tickSize: number;
  shares: number; // suggested shares: odd lot or 1 lot (1000 shares)
  requiredTickGain: number; // how many ticks to reach net +$500 after fee & tax
  targetSellPrice: number;
  totalCost: number;
  netProfit: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  feeEstimated: number;
  taxEstimated: number;
}

export function calculateDaily500Strategy(
  stock: StockQuote,
  targetProfit = 500,
  feeDiscount = 0.28
): Daily500Result | null {
  // MANDATORY: Exclude 00632R.TW from bull strategy calculations
  if (stock.symbol === '00632R.TW' || stock.isHedging) {
    return null;
  }

  const price = stock.price;
  const tick = getTickSize(price);

  // Taiwan fee: 0.1425% (buy & sell), discounted
  // Tax: ETF is 0.1%, ordinary stock is 0.3% (or 0.15% day trading)
  const isETF = stock.symbol.startsWith('00');
  const taxRate = isETF ? 0.001 : 0.0015; // use 0.15% for day-trade
  const brokerFeeRate = 0.001425 * feeDiscount;

  // Let's test a realistic share allocation:
  // For high price (>500), use odd lot (e.g. 100~300 shares)
  // For mid price (50~500), use 500~1000 shares
  // For lower price (<50), use 1000~2000 shares
  let shares = 1000;
  if (price >= 1000) shares = 100;
  else if (price >= 500) shares = 200;
  else if (price >= 200) shares = 500;
  else if (price < 50) shares = 2000;

  // Find minimum ticks needed where Net Profit >= targetProfit
  let requiredTicks = 1;
  let net = 0;
  let targetPrice = price;
  let fee = 0;
  let tax = 0;

  for (let t = 1; t <= 50; t++) {
    const candidatePrice = Math.round((price + t * tick) * 100) / 100;
    const buyGross = price * shares;
    const sellGross = candidatePrice * shares;

    const buyFee = Math.max(20 * feeDiscount, buyGross * brokerFeeRate);
    const sellFee = Math.max(20 * feeDiscount, sellGross * brokerFeeRate);
    const sellTax = sellGross * taxRate;

    const totalDeduction = buyFee + sellFee + sellTax;
    const candidateNet = sellGross - buyGross - totalDeduction;

    if (candidateNet >= targetProfit) {
      requiredTicks = t;
      targetPrice = candidatePrice;
      net = Math.round(candidateNet);
      fee = Math.round(buyFee + sellFee);
      tax = Math.round(sellTax);
      break;
    }
  }

  // Stop loss: based on 10MA or 1.5 * required ticks below
  const stopLossTicks = Math.max(2, requiredTicks);
  const stopLossPrice = Math.max(0.1, Math.round((price - stopLossTicks * tick) * 100) / 100);

  return {
    symbol: stock.symbol,
    name: stock.name,
    currentPrice: price,
    tickSize: tick,
    shares,
    requiredTickGain: requiredTicks,
    targetSellPrice: targetPrice,
    totalCost: Math.round(price * shares),
    netProfit: net,
    stopLossPrice,
    riskRewardRatio: 1.2,
    feeEstimated: fee,
    taxEstimated: tax,
  };
}
