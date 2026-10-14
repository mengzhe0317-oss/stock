import React, { useState } from 'react';
import { StockQuote, AppMode } from '../types/stock';
import {
  X,
  Sparkles,
  Send,
  Flame,
  Zap,
  Rocket,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

interface StockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockQuote | null;
  mode: AppMode;
  taiwanColorMode: boolean;
  onDiagnose: (stock: StockQuote) => void;
  isDiagnosing: boolean;
  onOpenLinePush: (stock: StockQuote) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  isOpen,
  onClose,
  stock,
  mode,
  taiwanColorMode,
  onDiagnose,
  isDiagnosing,
  onOpenLinePush,
}) => {
  if (!isOpen || !stock) return null;

  const [activeChartTab, setActiveChartTab] = useState<'kline' | 'kd' | 'macd' | 'boll'>('kline');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const ind = stock.indicators;
  const isHedging = stock.isHedging || stock.symbol === '00632R.TW';
  const bars = stock.history.slice(-45); // show last 45 bars for clean view

  const getPriceColor = (change: number) => {
    if (change === 0) return 'text-slate-400';
    if (taiwanColorMode) {
      return change > 0 ? 'text-rose-400' : 'text-emerald-400';
    } else {
      return change > 0 ? 'text-emerald-400' : 'text-rose-400';
    }
  };

  // SVG Chart Geometry
  const chartWidth = 640;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 25, left: 50 };

  const prices = bars.flatMap((b) => [b.high, b.low]);
  const minPrice = Math.min(...prices) * 0.985;
  const maxPrice = Math.max(...prices) * 1.015;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return (
      padding.top +
      ((maxPrice - val) / priceRange) * (chartHeight - padding.top - padding.bottom)
    );
  };

  const getX = (index: number) => {
    const usableWidth = chartWidth - padding.left - padding.right;
    return padding.left + (index / (bars.length - 1 || 1)) * usableWidth;
  };

  const barWidth = Math.max(3, (chartWidth - padding.left - padding.right) / bars.length - 3);

  // Active hovered bar or latest
  const activeBar = hoveredBarIndex !== null ? bars[hoveredBarIndex] : bars[bars.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold text-slate-100">{stock.name}</span>
              <span className="text-sm font-mono text-indigo-400 font-semibold">
                {stock.symbol}
              </span>
              <span className="text-xs text-slate-400 font-sans">{stock.category}</span>
            </div>

            {isHedging && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>獨立避險部位（強制排除多頭策略計算）</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right font-mono">
              <div className={`text-2xl font-bold ${getPriceColor(stock.change)}`}>
                {stock.price.toLocaleString(undefined, { minimumFractionDigits: stock.price < 10 ? 2 : 1 })}
              </div>
              <div className={`text-xs ${getPriceColor(stock.change)}`}>
                {stock.change > 0 ? '+' : ''}
                {stock.change} ({stock.changePercent > 0 ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Gemini AI Tactical Diagnosis Section */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  Gemini AI 80字實戰操盤診斷
                </h4>
                {stock.aiDiagnosis?.stance && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">
                    立場：{stock.aiDiagnosis.stance}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDiagnose(stock)}
                  disabled={isDiagnosing}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>{isDiagnosing ? 'AI 診斷中...' : '重新診斷'}</span>
                </button>

                <button
                  onClick={() => onOpenLinePush(stock)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-700/60 rounded-lg transition-colors"
                  title="推播至 LINE"
                >
                  <Send className="w-3 h-3" />
                  <span>LINE 推播</span>
                </button>
              </div>
            </div>

            {/* AI Diagnosis Output */}
            <div className="mt-4">
              {stock.aiDiagnosis ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
                    {stock.aiDiagnosis.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 border-t border-slate-800 text-slate-400">
                    <div>
                      關鍵防守位:{' '}
                      <span className="text-amber-400 font-bold text-sm">
                        {stock.aiDiagnosis.defensePrice} 元
                      </span>
                    </div>
                    <div>
                      勝率信賴度:{' '}
                      <span className="text-indigo-400 font-bold">
                        {stock.aiDiagnosis.confidence}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      來源: {stock.aiDiagnosis.source || 'gemini-3.8-flash'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  尚未生成實戰診斷。點擊「重新診斷」將基於上述真實指標數據即時分析。
                </div>
              )}
            </div>
          </div>

          {/* Indicators Matrix Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* MA & Squeeze */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] font-sans">5/10/20 糾結度</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {ind.squeeze.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {ind.isBreakout ? '🔥 已突破三線高點' : '未達突破條件'}
              </div>
            </div>

            {/* Slopes */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] font-sans">趨勢方向 (月/季)</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                月: {ind.maSlope20}
              </div>
              <div className="text-xs text-slate-400">季: {ind.maSlope60}</div>
            </div>

            {/* KD & MACD */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] font-sans">KD (9,3,3) / MACD</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                K {ind.k.toFixed(0)} / D {ind.d.toFixed(0)}
              </div>
              <div className="text-xs text-rose-400 mt-0.5">
                OSC: {ind.macdOsc > 0 ? '+' : ''}
                {ind.macdOsc.toFixed(2)} ({ind.macdStatus})
              </div>
            </div>

            {/* Bollinger */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="text-slate-500 text-[11px] font-sans">布林帶寬 / 上下軌</div>
              <div className="text-lg font-bold text-slate-200 mt-0.5">
                {ind.bandwidth.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                上 {ind.bollUpper.toFixed(1)} / 下 {ind.bollLower.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 font-sans">近期 K 線與指標軌跡</span>
                {activeBar && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    日期: {activeBar.date} | 開: {activeBar.open} | 高: {activeBar.high} | 低:{' '}
                    {activeBar.low} | 收: {activeBar.close}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800 text-[11px]">
                <button
                  onClick={() => setActiveChartTab('kline')}
                  className={`px-2 py-0.5 rounded ${
                    activeChartTab === 'kline' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  均線K線
                </button>
                <button
                  onClick={() => setActiveChartTab('boll')}
                  className={`px-2 py-0.5 rounded ${
                    activeChartTab === 'boll' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  布林通道
                </button>
                <button
                  onClick={() => setActiveChartTab('kd')}
                  className={`px-2 py-0.5 rounded ${
                    activeChartTab === 'kd' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  KD指標
                </button>
                <button
                  onClick={() => setActiveChartTab('macd')}
                  className={`px-2 py-0.5 rounded ${
                    activeChartTab === 'macd' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  MACD柱狀體
                </button>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 select-none"
              >
                {/* Horizontal price guide grid lines */}
                {[0.2, 0.5, 0.8].map((pct, idx) => {
                  const y = padding.top + pct * (chartHeight - padding.top - padding.bottom);
                  const priceLabel = (maxPrice - pct * priceRange).toFixed(1);
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="3 3"
                        strokeOpacity="0.5"
                      />
                      <text
                        x={padding.left - 6}
                        y={y + 3}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        className="font-mono"
                      >
                        {priceLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Bollinger Bands Shaded Area */}
                {activeChartTab === 'boll' && (
                  <path
                    d={`M ${getX(0)} ${getY(ind.bollUpper)} L ${getX(bars.length - 1)} ${getY(
                      ind.bollUpper
                    )} L ${getX(bars.length - 1)} ${getY(ind.bollLower)} L ${getX(0)} ${getY(
                      ind.bollLower
                    )} Z`}
                    fill="#6366f1"
                    fillOpacity="0.08"
                  />
                )}

                {/* Candlesticks */}
                {bars.map((bar, i) => {
                  const x = getX(i);
                  const isUp = bar.close >= bar.open;
                  const candleColor = taiwanColorMode
                    ? isUp
                      ? '#f43f5e'
                      : '#10b981'
                    : isUp
                    ? '#10b981'
                    : '#f43f5e';
                  const top = getY(Math.max(bar.open, bar.close));
                  const bottom = getY(Math.min(bar.open, bar.close));
                  const height = Math.max(2, bottom - top);

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredBarIndex(i)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* High-Low wick */}
                      <line
                        x1={x}
                        y1={getY(bar.high)}
                        x2={x}
                        y2={getY(bar.low)}
                        stroke={candleColor}
                        strokeWidth="1.2"
                      />
                      {/* Candle Body */}
                      <rect
                        x={x - barWidth / 2}
                        y={top}
                        width={barWidth}
                        height={height}
                        fill={isUp ? candleColor : candleColor}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* 20MA Line Overlay */}
                <line
                  x1={padding.left}
                  y1={getY(ind.ma20)}
                  x2={chartWidth - padding.right}
                  y2={getY(ind.ma20)}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-amber-400 inline-block"></span>
                  20MA 月線基準 ({ind.ma20.toFixed(1)})
                </span>
                {activeChartTab === 'boll' && (
                  <span className="text-indigo-400">
                    布林上軌 ({ind.bollUpper.toFixed(1)}) / 下軌 ({ind.bollLower.toFixed(1)})
                  </span>
                )}
              </div>
              <span>左圖 45 日交易曲線</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {isHedging ? '避險部位專屬監控視窗' : '多頭量化戰略視窗'}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
