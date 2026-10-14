import React, { useState } from 'react';
import { StockQuote, CustomRules } from '../types/stock';
import { calculateDaily500Strategy, Daily500Result } from '../utils/defaultData';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Copy,
} from 'lucide-react';

interface Daily500CalculatorProps {
  stocks: StockQuote[];
  customRules: CustomRules;
  taiwanColorMode: boolean;
  onOpenLinePush: (stock: StockQuote) => void;
  onDiagnoseStock: (stock: StockQuote) => void;
}

export const Daily500Calculator: React.FC<Daily500CalculatorProps> = ({
  stocks,
  customRules,
  taiwanColorMode,
  onOpenLinePush,
  onDiagnoseStock,
}) => {
  // CRITICAL: Mandatory exclusion of 00632R.TW from Daily 500 strategy calculation
  const eligibleStocks = stocks.filter((s) => s.symbol !== '00632R.TW' && !s.isHedging);

  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    eligibleStocks[0]?.symbol || '2330.TW'
  );
  const [targetProfit, setTargetProfit] = useState<number>(customRules.dailyTargetNTD || 500);
  const [feeDiscount, setFeeDiscount] = useState<number>(customRules.brokerFeeDiscount || 0.28);
  const [copySuccess, setCopySuccess] = useState(false);

  const currentStock = eligibleStocks.find((s) => s.symbol === selectedSymbol) || eligibleStocks[0];

  const strategyResult: Daily500Result | null = currentStock
    ? calculateDaily500Strategy(currentStock, targetProfit, feeDiscount)
    : null;

  const handleCopyOrderScript = () => {
    if (!strategyResult || !currentStock) return;
    const text = `🎯【台股每日賺$500極短線戰略】
標的：${currentStock.name} (${currentStock.symbol})
現價：${strategyResult.currentPrice} 元
建議部位：${strategyResult.shares} 股
目標停利價：${strategyResult.targetSellPrice} 元 (+${strategyResult.requiredTickGain} 檔跳動)
紀律防守停損價：${strategyResult.stopLossPrice} 元
預估淨利：+${strategyResult.netProfit} 元 (已扣除手續費${strategyResult.feeEstimated}元與證交稅${strategyResult.taxEstimated}元)
戰略提示：達標嚴守紀律停利，跌破防守價無條件離場。`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>「每日賺 500 元」極短線戰略計算器</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                小資當沖/隔日沖實戰
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              精算台股跳動檔位 (Ticks)、券商電子手續費折讓與當沖交易稅，算出達成淨利 $500
              的最少點數與停損防守位。
            </p>
          </div>
        </div>

        {/* Exclusion Rule Confirmation */}
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>強制排除 00632R.TW（反向避險不納入多頭當沖）</span>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parameter Selectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800">
            參數設定面板
          </h4>

          {/* Stock Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              選擇監控標的 (排除 00632R)
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {eligibleStocks.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} {stock.name} (${stock.price})
                </option>
              ))}
            </select>
          </div>

          {/* Target Profit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                目標淨利潤 (NTD)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                NT$ {targetProfit}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[300, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setTargetProfit(val)}
                  className={`py-1.5 text-xs rounded-lg font-mono font-semibold transition-colors ${
                    targetProfit === val
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Broker Fee Discount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                券商電子手續費折讓
              </label>
              <span className="text-xs font-mono text-slate-300">
                {(feeDiscount * 10).toFixed(1)} 折 ({(feeDiscount * 100).toFixed(0)}%)
              </span>
            </div>
            <select
              value={feeDiscount}
              onChange={(e) => setFeeDiscount(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value={0.28}>2.8 折 (多數一般數位帳戶)</option>
              <option value={0.2}>2.0 折 (大戶特惠單)</option>
              <option value={0.38}>3.8 折</option>
              <option value={0.6}>6.0 折 (傳統臨櫃單)</option>
            </select>
          </div>

          {/* Key Indicators of Current Stock */}
          {currentStock && (
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1.5">
              <div className="text-slate-400 text-[11px] font-sans font-semibold">
                指標共振即時評估
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">5/10/20 糾結度:</span>
                <span
                  className={
                    currentStock.indicators.squeeze <= 1.8 ? 'text-amber-400 font-bold' : 'text-slate-300'
                  }
                >
                  {currentStock.indicators.squeeze.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KD (9,3,3):</span>
                <span>
                  {currentStock.indicators.k.toFixed(0)} / {currentStock.indicators.d.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MACD 狀態:</span>
                <span className="text-rose-400">{currentStock.indicators.macdStatus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: Tactical Calculation Output */}
        <div className="lg:col-span-2 space-y-4">
          {strategyResult && currentStock ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>{currentStock.name}</span>
                    <span className="text-sm font-mono text-indigo-400">
                      {currentStock.symbol}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    跳動單位 (Tick):{' '}
                    <span className="font-mono text-slate-200 font-semibold">
                      {strategyResult.tickSize} 元
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyOrderScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已複製掛單文案</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>複製實戰掛單</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenLinePush(currentStock)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>LINE 推播</span>
                  </button>
                </div>
              </div>

              {/* Execution Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-xs font-sans">建議交易部位</div>
                  <div className="text-xl font-bold text-slate-100 mt-1">
                    {strategyResult.shares}{' '}
                    <span className="text-xs font-normal text-slate-400">股</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {strategyResult.shares >= 1000 ? '整張委託' : '盤中零股委託'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40">
                  <div className="text-slate-500 text-xs font-sans">達成目標需跳動</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    +{strategyResult.requiredTickGain}{' '}
                    <span className="text-xs font-normal text-slate-400">Ticks</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    價位跳升 +{(strategyResult.requiredTickGain * strategyResult.tickSize).toFixed(2)} 元
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-xs font-sans">目標停利賣出價</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {strategyResult.targetSellPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    成本現價 {strategyResult.currentPrice} 元
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="text-slate-500 text-xs font-sans">紀律防守停損價</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {strategyResult.stopLossPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">嚴格執行跌破離場</div>
                </div>
              </div>

              {/* Financial Math Breakdown */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-sans">
                  <span className="font-semibold text-slate-300">摩擦成本與預估淨利試算</span>
                  <span className="text-emerald-400 font-bold">
                    實際預估淨利: +NT$ {strategyResult.netProfit}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-slate-400">
                  <div>
                    <span className="text-slate-500">所需動用本金:</span>
                    <div className="text-slate-200 font-bold">
                      NT$ {strategyResult.totalCost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">預估手續費 (雙邊):</span>
                    <div className="text-slate-200">NT$ {strategyResult.feeEstimated}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">證券交易稅:</span>
                    <div className="text-slate-200">NT$ {strategyResult.taxEstimated}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">毛利金額:</span>
                    <div className="text-slate-200">
                      NT$ {strategyResult.netProfit + strategyResult.feeEstimated + strategyResult.taxEstimated}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Rules & Discipline Notice */}
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-200 mr-1">操盤紀律叮嚀：</span>
                極短線操作著重快進快出，當均線糾結突破或布林突破觸發時勝率最高。若未能在進場後 15
                分鐘內順利推升跳動點數，或觸及防守價位 {strategyResult.stopLossPrice} 元，必須無條件退場保護本金。
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              請從左側選單選擇欲試算的標的
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
