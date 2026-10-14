import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Send,
  AlertTriangle,
  Calculator,
  ArrowDownRight,
  TrendingDown,
  Info,
} from 'lucide-react';

interface HedgingModuleProps {
  stocks: StockQuote[];
  onDiagnoseStock: (stock: StockQuote) => void;
  onOpenLinePush: (stock: StockQuote) => void;
  onSelectStock: (stock: StockQuote) => void;
}

export const HedgingModule: React.FC<HedgingModuleProps> = ({
  stocks,
  onDiagnoseStock,
  onOpenLinePush,
  onSelectStock,
}) => {
  const hedgeStock = stocks.find((s) => s.symbol === '00632R.TW');
  const twii = stocks.find((s) => s.symbol === '^TWII');
  const etf0050 = stocks.find((s) => s.symbol === '0050.TW');

  // Hedging Calculator State
  const [portfolioValue, setPortfolioValue] = useState<number>(1000000); // 1,000,000 NTD
  const [hedgeScenario, setHedgeScenario] = useState<'normal' | 'caution' | 'bear'>('caution');

  // Determine market status
  const twiiAbove20 = twii ? twii.price >= twii.indicators.ma20 : true;
  const twiiAbove60 = twii ? twii.price >= twii.indicators.ma60 : true;

  // Hedge ratio recommended
  const hedgeRatios = {
    normal: 0.05, // 5%
    caution: 0.15, // 15%
    bear: 0.25, // 25%
  };

  const currentRatio = hedgeRatios[hedgeScenario];
  const targetHedgeAmount = portfolioValue * currentRatio;
  const hedgePrice = hedgeStock ? hedgeStock.price : 3.38;
  const costPerLot = hedgePrice * 1000;
  const suggestedLots = Math.max(1, Math.round(targetHedgeAmount / costPerLot));
  const actualHedgeCost = suggestedLots * costPerLot;

  // Estimated downside cushion
  const marketDropPercent = 3.0; // 3% drop
  const portfolioLoss = portfolioValue * (marketDropPercent / 100);
  const hedgeGain = actualHedgeCost * (marketDropPercent / 100);
  const netRiskMitigated = Math.round((hedgeGain / portfolioLoss) * 100);

  return (
    <div className="space-y-6">
      {/* Mandatory Exclusion Announcement */}
      <div className="bg-purple-950/30 border border-purple-800/60 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-900/60 text-purple-300 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                00632R.TW (元大台灣50反1) 獨立避險部位專區
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                強制排除規則啟用
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              本系統在執行「常規多頭選股」、「指標共振掃描」以及「每日賺 500 元」極短線戰略計算時，
              <strong className="text-amber-400">嚴格自動排除 00632R.TW</strong>
              。反向 ETF
              專門用於大盤破線時的對沖防守，避免多頭演算法錯誤將跌深反向標的當作多頭突破。
            </p>
          </div>
        </div>
      </div>

      {/* 00632R Live Status Card */}
      {hedgeStock && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-100">{hedgeStock.name}</span>
                <span className="text-xs font-mono text-purple-400 font-semibold">
                  {hedgeStock.symbol}
                </span>
                <span className="text-xs text-slate-500 font-mono">反向一倍 ETF</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                與加權指數 (^TWII) 及元大台灣50 (0050) 呈現 -0.98 反向連動關係
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right font-mono">
                <div className="text-2xl font-bold text-slate-100">
                  {hedgeStock.price.toFixed(2)}
                </div>
                <div
                  className={`text-xs ${
                    hedgeStock.change >= 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {hedgeStock.change >= 0 ? '+' : ''}
                  {hedgeStock.change.toFixed(2)} ({hedgeStock.changePercent.toFixed(2)}%)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDiagnoseStock(hedgeStock)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI 避險策略</span>
                </button>
                <button
                  onClick={() => onOpenLinePush(hedgeStock)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                  title="推播 00632R 避險報告"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Indicators Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">20MA(月線) 防守關卡</div>
              <div className="text-slate-200 font-bold mt-0.5">
                {hedgeStock.indicators.ma20.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">
                趨勢: {hedgeStock.indicators.maSlope20}
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">60MA(季線) 壓力關卡</div>
              <div className="text-slate-200 font-bold mt-0.5">
                {hedgeStock.indicators.ma60.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">
                趨勢: {hedgeStock.indicators.maSlope60}
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">KD (9,3,3)</div>
              <div className="text-slate-200 font-bold mt-0.5">
                {hedgeStock.indicators.k.toFixed(1)} / {hedgeStock.indicators.d.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500">
                交叉: {hedgeStock.indicators.kdCross}
              </div>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[11px]">布林通道上軌</div>
              <div className="text-slate-200 font-bold mt-0.5">
                {hedgeStock.indicators.bollUpper.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">
                帶寬: {hedgeStock.indicators.bandwidth.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Hedging Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100">00632R 多頭部位避險對沖計算器</h4>
            <p className="text-xs text-slate-400">
              根據現有多頭投資組合總市值，動態試算大盤回檔時的 00632R 配置張數與風險對沖效果
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                多頭總持股現值 (NTD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500">NT$</span>
                <input
                  type="number"
                  step="50000"
                  value={portfolioValue}
                  onChange={(e) => setPortfolioValue(Math.max(10000, Number(e.target.value)))}
                  className="w-full pl-10 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                大盤目前風險防守情境
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="scenario"
                    checked={hedgeScenario === 'normal'}
                    onChange={() => setHedgeScenario('normal')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">微型防禦 (5% 避險配置)</span>
                    <div className="text-[11px] text-slate-500">
                      大盤穩於月線以上，多頭格局健全
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-indigo-700/40 cursor-pointer">
                  <input
                    type="radio"
                    name="scenario"
                    checked={hedgeScenario === 'caution'}
                    onChange={() => setHedgeScenario('caution')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-amber-300 font-medium">中度避險 (15% 避險配置)</span>
                    <div className="text-[11px] text-slate-400">
                      加權指數跌破20MA月線，均線糾結轉弱
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="radio"
                    name="scenario"
                    checked={hedgeScenario === 'bear'}
                    onChange={() => setHedgeScenario('bear')}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-rose-400 font-medium">全面防護 (25% 避險配置)</span>
                    <div className="text-[11px] text-slate-500">
                      大盤跌破60MA季線，季線翻黑下彎
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-xl font-mono">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs font-sans">建議避險配置張數</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {suggestedLots} <span className="text-xs font-normal text-slate-400">張</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                約 {(suggestedLots * 1000).toLocaleString()} 股 (每張約{' '}
                {costPerLot.toLocaleString(undefined, { maximumFractionDigits: 0 })} 元)
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs font-sans">預計投入避險成本</span>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                NT$ {Math.round(actualHedgeCost).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                佔總投資組合: {((actualHedgeCost / portfolioValue) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-sans">
                  極端回檔抗震效果試算 (假設大盤單日回檔 -3.0%)
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  有效緩衝 ~{netRiskMitigated}%
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500">多頭部位估計浮虧:</div>
                  <div className="text-rose-400 font-bold">
                    -NT$ {Math.round(portfolioLoss).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">00632R 預估收益抵銷:</div>
                  <div className="text-emerald-400 font-bold">
                    +NT$ {Math.round(hedgeGain).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
