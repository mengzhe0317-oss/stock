import React, { useState } from 'react';
import { BatchDiagnosisResult, StockQuote } from '../types/stock';
import {
  Sparkles,
  X,
  Send,
  Copy,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Zap,
} from 'lucide-react';

interface BatchDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BatchDiagnosisResult | null;
  stocks: StockQuote[];
  onOpenLinePush: (stock: StockQuote) => void;
}

export const BatchDiagnosisModal: React.FC<BatchDiagnosisModalProps> = ({
  isOpen,
  onClose,
  result,
  stocks,
  onOpenLinePush,
}) => {
  if (!isOpen || !result) return null;

  const [copied, setCopied] = useState(false);

  const nonHedging = stocks.filter((s) => s.symbol !== '00632R.TW' && !s.isHedging);
  const breakoutStocks = nonHedging.filter((s) => s.indicators.isBreakout);
  const momentumStocks = nonHedging.filter((s) => s.indicators.isMomentumBull);
  const hedgeStock = stocks.find((s) => s.symbol === '00632R.TW');

  const fullReportText = `📈【台股量化全局盤勢與 AI 戰略診斷】
發布時間：${result.timestamp}

📊【宏觀量化指標狀態】
• 監控標的：${stocks.length} 檔 (多頭池: ${nonHedging.length} 檔)
• 糾結突破觸發：${breakoutStocks.map((s) => s.name).join('、') || '無'}
• 動能翻多觸發：${momentumStocks.map((s) => s.name).join('、') || '無'}

🤖【Gemini AI 盤勢精闢診斷】
${result.marketOverview}

🎯【操盤手即戰力指令】
${result.actionPlan}

🛡️【00632R 獨立避險部位】
當前現價 ${hedgeStock?.price || 3.38} 元。已強制自多頭選股排除，當大盤跌破月線時啟動 15% 避險配置。`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Gemini AI 一鍵全局戰略診斷報告
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                依據全市場真實指標數據多重共振生成
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Overview Callout */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30">
            <div className="text-indigo-400 font-semibold mb-1 flex items-center gap-1.5">
              <span>盤勢精闢診斷</span>
            </div>
            <p className="text-sm text-slate-100 font-sans leading-relaxed">
              {result.marketOverview}
            </p>
          </div>

          {/* Action Directive */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 font-semibold mb-1">即戰力操盤指令</div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">{result.actionPlan}</p>
          </div>

          {/* Resonance Signals Summary */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-slate-500 text-[11px] font-sans flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>均線糾結突破標的 ({breakoutStocks.length})</span>
              </div>
              <div className="mt-1 text-slate-200 font-bold">
                {breakoutStocks.map((s) => s.name).join('、') || '無'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="text-slate-500 text-[11px] font-sans flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>動能翻多標的 ({momentumStocks.length})</span>
              </div>
              <div className="mt-1 text-slate-200 font-bold">
                {momentumStocks.map((s) => s.name).join('、') || '無'}
              </div>
            </div>
          </div>

          {/* Hedging Note */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300">
              <span className="font-semibold text-purple-300">
                00632R (元大台灣50反1) 避險對沖提示：
              </span>
              本報告已遵循強制排除規則，多頭推薦中絕不包含 00632R。若加權指數
              (^TWII) 跌破月線，建議啟動 15% 避險對沖以平抑多頭波動。
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            生成時間：{result.timestamp}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已複製報告</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製全局報告</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (stocks[0]) onOpenLinePush(stocks[0]);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>推播至 LINE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
