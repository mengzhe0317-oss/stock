import React from 'react';
import { StockQuote } from '../types/stock';
import {
  Flame,
  Zap,
  Rocket,
  Sparkles,
  Send,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface ResonanceScannerProps {
  stocks: StockQuote[];
  taiwanColorMode: boolean;
  onSelectStock: (stock: StockQuote) => void;
  onDiagnoseStock: (stock: StockQuote) => void;
  onOpenLinePush: (stock: StockQuote) => void;
}

export const ResonanceScanner: React.FC<ResonanceScannerProps> = ({
  stocks,
  taiwanColorMode,
  onSelectStock,
  onDiagnoseStock,
  onOpenLinePush,
}) => {
  // CRITICAL: Mandatory exclusion of 00632R.TW and any isHedging stocks from bull scans
  const bullStocks = stocks.filter((s) => s.symbol !== '00632R.TW' && !s.isHedging);

  const breakoutList = bullStocks.filter((s) => s.indicators.isBreakout);
  const momentumList = bullStocks.filter((s) => s.indicators.isMomentumBull);
  const bollList = bullStocks.filter((s) => s.indicators.isBollBreakout);

  // Triple or Double Resonance (Strongest conviction)
  const tripleResonance = bullStocks.filter(
    (s) => s.indicators.isBreakout && s.indicators.isMomentumBull
  );

  const getPriceColor = (change: number) => {
    if (change === 0) return 'text-slate-400';
    if (taiwanColorMode) {
      return change > 0 ? 'text-rose-400' : 'text-emerald-400';
    } else {
      return change > 0 ? 'text-emerald-400' : 'text-rose-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Exclusion Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>多頭量化共振掃描引擎</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                純多頭策略
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              依據 5/10/20MA 糾結度、季線斜率、KD(9,3,3)與 MACD 雙動能、布林通道帶寬自動掃描。
              <span className="text-amber-400 font-medium ml-1">
                【已強制排除 00632R.TW 避險部位】
              </span>
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>
            有效多頭掃描池:{' '}
            <span className="font-mono text-slate-100 font-bold">{bullStocks.length}</span> 檔
          </div>
          <div className="text-[11px] text-slate-500">排除反向標的: 1 檔</div>
        </div>
      </div>

      {/* Triple Resonance Spotlight */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">
                👑 雙重/三重指標強烈共振特選
              </h4>
              <p className="text-xs text-slate-400">
                同時滿足「均線糾結突破 (Squeeze ≤ 1.8%)」且「KD/MACD動能翻多」之強勢核心
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-1 rounded">
            {tripleResonance.length} 檔觸發
          </span>
        </div>

        {tripleResonance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tripleResonance.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-slate-900/90 border border-indigo-500/40 rounded-xl p-4 hover:border-indigo-400 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{stock.name}</span>
                      <span className="text-xs text-indigo-400 font-mono">{stock.symbol}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{stock.category}</div>
                  </div>
                  <div className={`text-right font-mono font-bold ${getPriceColor(stock.change)}`}>
                    <div className="text-base">{stock.price}</div>
                    <div className="text-xs">
                      {stock.changePercent > 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Quantitative Signals breakdown */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono py-2 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-500">糾結度</div>
                    <div className="text-amber-400 font-bold">
                      {stock.indicators.squeeze.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">KD (K/D)</div>
                    <div className="text-slate-200">
                      {stock.indicators.k.toFixed(0)}/{stock.indicators.d.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">MACD OSC</div>
                    <div className="text-rose-400 font-bold">
                      {stock.indicators.macdOsc > 0 ? '+' : ''}
                      {stock.indicators.macdOsc.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onDiagnoseStock(stock)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini 戰略</span>
                  </button>
                  <button
                    onClick={() => onOpenLinePush(stock)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    title="LINE 推播文案"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectStock(stock)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-xs"
                    title="K 線分析"
                  >
                    圖表
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            目前無標的同時觸發均線糾結突破與動能翻多，建議關注下方個別指標發動訊號。
          </div>
        )}
      </div>

      {/* Grid of Indicator Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category 1: 均線糾結突破 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">🔥 均線糾結突破</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-400">
              {breakoutList.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 mb-3">
            5/10/20MA 糾結度 ≤ 1.8% 且現價站上三線最高點
          </p>

          <div className="space-y-2.5">
            {breakoutList.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-amber-500/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200 text-xs">
                    {stock.name}{' '}
                    <span className="text-slate-500 font-mono text-[11px]">({stock.symbol})</span>
                  </div>
                  <span className={`font-mono text-xs font-bold ${getPriceColor(stock.change)}`}>
                    {stock.price} ({stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                  <span>糾結度: {stock.indicators.squeeze.toFixed(2)}%</span>
                  <span className="text-amber-400">突破發動</span>
                </div>
              </div>
            ))}
            {breakoutList.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-600">無糾結突破標的</div>
            )}
          </div>
        </div>

        {/* Category 2: 動能翻多 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-200">⚡ 動能翻多</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-400">
              {momentumList.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 mb-3">
            季線向上 且 (KD黃金交叉 或 MACD綠柱縮腳/翻紅)
          </p>

          <div className="space-y-2.5">
            {momentumList.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-indigo-500/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200 text-xs">
                    {stock.name}{' '}
                    <span className="text-slate-500 font-mono text-[11px]">({stock.symbol})</span>
                  </div>
                  <span className={`font-mono text-xs font-bold ${getPriceColor(stock.change)}`}>
                    {stock.price} ({stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                  <span>
                    K/D: {stock.indicators.k.toFixed(0)}/{stock.indicators.d.toFixed(0)}
                  </span>
                  <span className="text-indigo-400">{stock.indicators.macdStatus}</span>
                </div>
              </div>
            ))}
            {momentumList.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-600">無動能翻多標的</div>
            )}
          </div>
        </div>

        {/* Category 3: 布林突破 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-slate-200">🚀 布林突破</h4>
            </div>
            <span className="text-xs font-mono font-semibold text-rose-400">
              {bollList.length} 檔
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 mb-3">
            現價突破布林通道上軌 (20MA + 2倍標準差)
          </p>

          <div className="space-y-2.5">
            {bollList.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-rose-500/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200 text-xs">
                    {stock.name}{' '}
                    <span className="text-slate-500 font-mono text-[11px]">({stock.symbol})</span>
                  </div>
                  <span className={`font-mono text-xs font-bold ${getPriceColor(stock.change)}`}>
                    {stock.price} ({stock.changePercent > 0 ? '+' : ''}
                    {stock.changePercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
                  <span>上軌: {stock.indicators.bollUpper.toFixed(1)}</span>
                  <span className="text-rose-400">帶寬 {stock.indicators.bandwidth.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {bollList.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-600">無布林突破標的</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
