import React, { useState } from 'react';
import { StockQuote } from '../types/stock';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  Zap,
  Rocket,
  ShieldAlert,
  Send,
  Plus,
  Trash2,
  LineChart,
  Upload,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface WatchlistTableProps {
  stocks: StockQuote[];
  taiwanColorMode: boolean;
  onSelectStock: (stock: StockQuote) => void;
  onDiagnoseStock: (stock: StockQuote) => void;
  onOpenLinePush: (stock: StockQuote) => void;
  onAddStock: () => void;
  onDeleteStock: (symbol: string) => void;
  onOpenImport: () => void;
  onExportData: () => void;
  isDiagnosingSymbol: string | null;
}

export const WatchlistTable: React.FC<WatchlistTableProps> = ({
  stocks,
  taiwanColorMode,
  onSelectStock,
  onDiagnoseStock,
  onOpenLinePush,
  onAddStock,
  onDeleteStock,
  onOpenImport,
  onExportData,
  isDiagnosingSymbol,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'breakout' | 'momentum' | 'hedging'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Apply Taiwan stock color rules:
  // In Taiwan: Up = Red (text-rose-400 / text-red-500), Down = Green (text-emerald-400)
  // International: Up = Green, Down = Red
  const getPriceColor = (change: number) => {
    if (change === 0) return 'text-slate-400';
    if (taiwanColorMode) {
      return change > 0 ? 'text-rose-400' : 'text-emerald-400';
    } else {
      return change > 0 ? 'text-emerald-400' : 'text-rose-400';
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'breakout') return stock.indicators.isBreakout && !stock.isHedging;
    if (filterType === 'momentum') return stock.indicators.isMomentumBull && !stock.isHedging;
    if (filterType === 'hedging') return stock.isHedging;
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>觀察清單與量化矩陣</span>
            <span className="text-xs font-normal text-slate-400 tabular-nums">
              ({filteredStocks.length}/{stocks.length} 檔)
            </span>
          </h2>

          {/* Quick Filters */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType('breakout')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterType === 'breakout'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>糾結突破</span>
            </button>
            <button
              onClick={() => setFilterType('momentum')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterType === 'momentum'
                  ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-indigo-400" />
              <span>動能翻多</span>
            </button>
            <button
              onClick={() => setFilterType('hedging')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                filterType === 'hedging'
                  ? 'bg-purple-950/70 text-purple-300 border border-purple-700/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-purple-400" />
              <span>獨立避險</span>
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="搜尋代號或名稱 (如 2330)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
          />

          <button
            onClick={onAddStock}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增標的</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title="匯入即時/歷史報價 CSV 或 JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>匯入</span>
          </button>

          <button
            onClick={onExportData}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            title="匯出當前量化指標與 K 線資料"
          >
            <Download className="w-3.5 h-3.5" />
            <span>匯出</span>
          </button>
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-medium">
              <th className="py-3 px-4">標的代號 / 名稱</th>
              <th className="py-3 px-3 text-right">現價</th>
              <th className="py-3 px-3 text-right">漲跌幅</th>
              <th className="py-3 px-3 text-right">5MA / 20MA / 60MA</th>
              <th className="py-3 px-3 text-center">均線糾結度</th>
              <th className="py-3 px-3 text-center">趨勢方向 (月/季)</th>
              <th className="py-3 px-3 text-center">KD (9,3,3) / MACD</th>
              <th className="py-3 px-3 text-center">布林通道 (帶寬%)</th>
              <th className="py-3 px-3 text-center">即時共振警示燈</th>
              <th className="py-3 px-4 text-right">實戰戰略與推播</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredStocks.map((stock) => {
              const ind = stock.indicators;
              const isHedging = stock.isHedging || stock.symbol === '00632R.TW';
              const isDiagnosing = isDiagnosingSymbol === stock.symbol;

              return (
                <tr
                  key={stock.symbol}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isHedging ? 'bg-purple-950/10' : ''
                  }`}
                >
                  {/* Symbol & Name */}
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectStock(stock)}
                            className="font-bold text-slate-100 hover:text-indigo-400 transition-colors underline-offset-2 hover:underline text-sm"
                          >
                            {stock.symbol}
                          </button>
                          <span className="text-slate-300 font-semibold">{stock.name}</span>
                        </div>

                        {/* Hedging Exclusion Rule Badge */}
                        {isHedging ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>獨立避險部位（不納入多頭策略計算）</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-sans">
                            {stock.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className={`py-3 px-3 text-right font-bold text-sm tabular-nums ${getPriceColor(stock.change)}`}>
                    {stock.price.toLocaleString(undefined, { minimumFractionDigits: stock.price < 10 ? 2 : stock.price > 1000 ? 0 : 1 })}
                  </td>

                  {/* Change & Percent */}
                  <td className={`py-3 px-3 text-right tabular-nums ${getPriceColor(stock.change)}`}>
                    <div className="flex items-center justify-end gap-1">
                      {stock.change > 0 ? (
                        <TrendingUp className="w-3 h-3 shrink-0" />
                      ) : stock.change < 0 ? (
                        <TrendingDown className="w-3 h-3 shrink-0" />
                      ) : null}
                      <span>
                        {stock.change > 0 ? '+' : ''}
                        {stock.change.toFixed(stock.price < 10 ? 2 : 1)}
                      </span>
                    </div>
                    <div className="text-[11px]">
                      {stock.changePercent > 0 ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </td>

                  {/* Moving Averages */}
                  <td className="py-3 px-3 text-right tabular-nums text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] mr-1">5M:</span>
                      {ind.ma5.toFixed(1)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500 text-[10px] mr-1">20M:</span>
                      {ind.ma20.toFixed(1)}
                      <span className="mx-1 text-slate-600">/</span>
                      <span className="text-slate-500 text-[10px] mr-1">60M:</span>
                      {ind.ma60.toFixed(1)}
                    </div>
                  </td>

                  {/* Squeeze Degree */}
                  <td className="py-3 px-3 text-center tabular-nums">
                    <span
                      className={`font-semibold ${
                        ind.squeeze <= 1.8 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {ind.squeeze.toFixed(2)}%
                    </span>
                    <div className="text-[10px] text-slate-500">
                      {ind.squeeze <= 1.8 ? '緊縮待發' : '均線分散'}
                    </div>
                  </td>

                  {/* Trend Slopes */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-col gap-0.5 text-[11px]">
                      <span
                        className={
                          ind.maSlope20.includes('翻揚')
                            ? 'text-rose-400 font-medium'
                            : ind.maSlope20.includes('下彎')
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      >
                        月: {ind.maSlope20}
                      </span>
                      <span
                        className={
                          ind.maSlope60.includes('翻揚')
                            ? 'text-rose-400 font-medium'
                            : ind.maSlope60.includes('下彎')
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }
                      >
                        季: {ind.maSlope60}
                      </span>
                    </div>
                  </td>

                  {/* KD & MACD */}
                  <td className="py-3 px-3 text-center tabular-nums">
                    <div className="text-slate-200">
                      <span className="text-slate-500 text-[10px] mr-1">K/D:</span>
                      <span className={ind.k > ind.d ? 'text-amber-300 font-semibold' : 'text-slate-300'}>
                        {ind.k.toFixed(0)}
                      </span>
                      <span className="text-slate-500 mx-0.5">/</span>
                      <span>{ind.d.toFixed(0)}</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-slate-500 text-[10px] mr-1">OSC:</span>
                      <span
                        className={`font-semibold ${
                          ind.macdOsc >= 0
                            ? 'text-rose-400'
                            : ind.macdStatus === '綠柱縮腳'
                            ? 'text-amber-300'
                            : 'text-emerald-400'
                        }`}
                      >
                        {ind.macdOsc > 0 ? '+' : ''}
                        {ind.macdOsc.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({ind.macdStatus})</span>
                    </div>
                  </td>

                  {/* Bollinger */}
                  <td className="py-3 px-3 text-center tabular-nums">
                    <div className="text-slate-300">
                      <span className="text-slate-500 text-[10px] mr-1">帶寬:</span>
                      <span className="font-semibold">{ind.bandwidth.toFixed(1)}%</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      上軌 {ind.bollUpper.toFixed(1)}
                    </div>
                  </td>

                  {/* Active Alert Signals */}
                  <td className="py-3 px-3 text-center">
                    {isHedging ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded font-sans">
                        <ShieldAlert className="w-3 h-3 text-purple-400" />
                        <span>獨立避險監控</span>
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-1 font-sans">
                        {ind.isBreakout && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-600/70 px-1.5 py-0.5 rounded animate-pulse shadow-sm">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>糾結突破</span>
                          </span>
                        )}
                        {ind.isMomentumBull && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-600/70 px-1.5 py-0.5 rounded shadow-sm">
                            <Zap className="w-3 h-3 text-indigo-400" />
                            <span>動能翻多</span>
                          </span>
                        )}
                        {ind.isBollBreakout && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/60 border border-rose-600/70 px-1.5 py-0.5 rounded shadow-sm">
                            <Rocket className="w-3 h-3 text-rose-400" />
                            <span>布林突破</span>
                          </span>
                        )}
                        {!ind.isBreakout && !ind.isMomentumBull && !ind.isBollBreakout && (
                          <span className="text-slate-500 text-[11px]">區間無異常</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Actions & AI Diagnostic */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onDiagnoseStock(stock)}
                        disabled={isDiagnosing}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/60 transition-colors disabled:opacity-50"
                        title="呼叫 Gemini AI 進行80字量化實戰診斷"
                      >
                        <Sparkles className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} />
                        <span>AI診斷</span>
                      </button>

                      <button
                        onClick={() => onOpenLinePush(stock)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        title="預覽與發送 LINE 推播文案"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectStock(stock)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title="查看完整 K 線與指標副圖"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                      </button>

                      {stock.symbol !== '2330.TW' && stock.symbol !== '00632R.TW' && (
                        <button
                          onClick={() => onDeleteStock(stock.symbol)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="從清單移除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick AI Stance badge if already diagnosed */}
                    {stock.aiDiagnosis && (
                      <div className="mt-1 text-[11px] font-sans text-slate-400 text-right">
                        <span className="font-semibold text-slate-200">
                          [{stock.aiDiagnosis.stance}]
                        </span>{' '}
                        防守: {stock.aiDiagnosis.defensePrice}元
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredStocks.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm">查無符合條件的標的</p>
          <button
            onClick={() => {
              setFilterType('all');
              setSearchTerm('');
            }}
            className="mt-2 text-xs text-indigo-400 hover:underline"
          >
            重設篩選條件
          </button>
        </div>
      )}
    </div>
  );
};
