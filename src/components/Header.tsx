import React from 'react';
import { AppMode } from '../types/stock';
import {
  Activity,
  BarChart3,
  Sparkles,
  ShieldAlert,
  Sliders,
  DollarSign,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'watchlist' | 'resonance' | 'hedging' | 'daily500';
  onSelectTab: (tab: 'watchlist' | 'resonance' | 'hedging' | 'daily500') => void;
  mode: AppMode;
  onToggleMode: (mode: AppMode) => void;
  onOpenCustomRules: () => void;
  onBatchDiagnose: () => void;
  isBatchDiagnosing: boolean;
  onManualRefresh: () => void;
  isLiveUpdating: boolean;
  onToggleLive: () => void;
  taiwanColorMode: boolean;
  onToggleColorMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  mode,
  onToggleMode,
  onOpenCustomRules,
  onBatchDiagnose,
  isBatchDiagnosing,
  onManualRefresh,
  isLiveUpdating,
  onToggleLive,
  taiwanColorMode,
  onToggleColorMode,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur">
      {/* Top Bar Zone 1, 2, 3 following strict Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center font-bold text-white shadow-sm">
            台
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
            台股量化戰略終端
          </span>
        </div>

        {/* Zone 2: 4-5 single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onSelectTab('watchlist')}
            className={`transition-colors whitespace-nowrap py-1 ${
              currentTab === 'watchlist'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            標的追蹤清單
          </button>
          <button
            onClick={() => onSelectTab('resonance')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'resonance'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'hover:text-slate-200'
            }`}
          >
            <span>多頭共振掃描</span>
          </button>
          <button
            onClick={() => onSelectTab('hedging')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'hedging'
                ? 'text-amber-400 border-b-2 border-amber-500 font-semibold'
                : 'hover:text-amber-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>00632R 避險部位</span>
          </button>
          <button
            onClick={() => onSelectTab('daily500')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 ${
              currentTab === 'daily500'
                ? 'text-emerald-400 border-b-2 border-emerald-500 font-semibold'
                : 'hover:text-emerald-300'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>每日賺500元戰略</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBatchDiagnose}
            disabled={isBatchDiagnosing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isBatchDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isBatchDiagnosing ? 'AI 診斷運算中...' : '一鍵全局診斷'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Workspace Toolbar: Mode Switch, Custom Formula Button, Color Toggle */}
      <div className="bg-slate-900/80 border-t border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Dual Mode Switcher (盤中即時 vs 盤後掃描) */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => onToggleMode('intraday')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                mode === 'intraday'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ 盤中即時監控</span>
            </button>
            <button
              onClick={() => onToggleMode('afterhours')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                mode === 'afterhours'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📊 盤後定時掃描</span>
            </button>
          </div>

          {/* Quick Actions & Preferences */}
          <div className="flex items-center gap-2">
            {mode === 'intraday' && (
              <button
                onClick={onToggleLive}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors ${
                  isLiveUpdating
                    ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                title="自動輪詢模擬盤中報價"
              >
                <Activity className="w-3 h-3" />
                <span>模擬即時流: {isLiveUpdating ? '運行中' : '已暫停'}</span>
              </button>
            )}

            <button
              onClick={onManualRefresh}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
              title="即刻重新計算全部指標"
            >
              <RefreshCw className="w-3 h-3" />
              <span>刷新行情</span>
            </button>

            <button
              onClick={onToggleColorMode}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 transition-colors"
              title="切換漲跌色彩規則"
            >
              {taiwanColorMode ? '🇹🇼 台股慣例 (紅漲綠跌)' : '🌐 國際慣例 (綠漲紅跌)'}
            </button>

            <button
              onClick={onOpenCustomRules}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors font-medium"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>💡 個人看盤技巧面板</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
