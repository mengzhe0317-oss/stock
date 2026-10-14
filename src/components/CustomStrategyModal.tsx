import React, { useState } from 'react';
import { CustomRules } from '../types/stock';
import { Sliders, X, Check, RotateCcw, Lightbulb, Save } from 'lucide-react';

interface CustomStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: CustomRules;
  onSaveRules: (rules: CustomRules) => void;
  onResetRules: () => void;
}

export const CustomStrategyModal: React.FC<CustomStrategyModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  onResetRules,
}) => {
  if (!isOpen) return null;

  const [formState, setFormState] = useState<CustomRules>({ ...rules });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveRules(formState);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                💡 個人看指數專屬技巧與量化參數
              </h3>
              <p className="text-xs text-slate-400">
                自訂均線糾結閾值、布林倍數、動能過濾與專屬看盤技巧備忘錄
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Squeeze Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200">
                均線糾結度判定閾值 (5/10/20MA)
              </label>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formState.squeezeThreshold.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.1"
              value={formState.squeezeThreshold}
              onChange={(e) =>
                setFormState({ ...formState, squeezeThreshold: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.8% (極度收斂緊縮)</span>
              <span>1.8% (標準推薦值)</span>
              <span>3.5% (寬鬆糾結)</span>
            </div>
          </div>

          {/* Bollinger Band Multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200">
                布林通道標準差倍數 (Bollinger Multiplier)
              </label>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {formState.bollStdDev.toFixed(1)} 倍
              </span>
            </div>
            <input
              type="range"
              min="1.5"
              max="2.5"
              step="0.1"
              value={formState.bollStdDev}
              onChange={(e) =>
                setFormState({ ...formState, bollStdDev: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.5 倍 (敏感突破)</span>
              <span>2.0 倍 (標準2倍標準差)</span>
              <span>2.5 倍 (極端通道)</span>
            </div>
          </div>

          {/* KD Golden Cross Lookback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200">
                KD 黃金交叉有效回溯天數 (天)
              </label>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {formState.kdGoldenCrossLookback} 日內
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formState.kdGoldenCrossLookback}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  kdGoldenCrossLookback: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 日 (當日剛交叉)</span>
              <span>2 日 (建議標準)</span>
              <span>5 日 (動能延續)</span>
            </div>
          </div>

          {/* Require 60MA Upward */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <div className="font-semibold text-slate-200">
                強制過濾季線 (60MA) 必須翻揚 ▲
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                若關閉，即使季線走平或下彎，只要短線動能翻多仍點亮警示
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formState.require60MAUpward}
                onChange={(e) =>
                  setFormState({ ...formState, require60MAUpward: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Personal Strategy Notes & Custom Formula Desk */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>💡 個人專屬看盤技巧備忘錄與進階心法</span>
            </label>
            <textarea
              rows={4}
              value={formState.customNotes}
              onChange={(e) => setFormState({ ...formState, customNotes: e.target.value })}
              placeholder="例如：當加權指數與台指期逆價差擴大至 50 點以上，且 2330 突破糾結時為發動點；破月線啟動 00632R 對沖..."
              className="w-full p-3 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => {
              onResetRules();
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>回復預設值</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>已儲存套用</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>儲存並即刻重算</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
