import React, { useState, useEffect, useCallback } from 'react';
import {
  StockQuote,
  AppMode,
  CustomRules,
  BatchDiagnosisResult,
  AIDiagnosis,
} from './types/stock';
import { createInitialWatchlist, getTickSize } from './utils/defaultData';
import { computeIndicators, DEFAULT_CUSTOM_RULES } from './utils/indicators';
import { Header } from './components/Header';
import { WatchlistTable } from './components/WatchlistTable';
import { ResonanceScanner } from './components/ResonanceScanner';
import { HedgingModule } from './components/HedgingModule';
import { Daily500Calculator } from './components/Daily500Calculator';
import { CustomStrategyModal } from './components/CustomStrategyModal';
import { LinePushModal } from './components/LinePushModal';
import { StockDetailModal } from './components/StockDetailModal';
import { ImportExportModal } from './components/ImportExportModal';
import { BatchDiagnosisModal } from './components/BatchDiagnosisModal';
import {
  Activity,
  AlertTriangle,
  Flame,
  Zap,
  Rocket,
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

const STORAGE_KEY_STOCKS = 'TW_STOCK_WATCHLIST_DATA_V1';
const STORAGE_KEY_RULES = 'TW_STOCK_CUSTOM_RULES_V1';
const STORAGE_KEY_COLOR = 'TW_STOCK_COLOR_MODE_V1';

export default function App() {
  // Load custom rules from localStorage
  const [customRules, setCustomRules] = useState<CustomRules>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RULES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved rules:', e);
    }
    return DEFAULT_CUSTOM_RULES;
  });

  // Load stocks or initialize with realistic defaults
  const [stocks, setStocks] = useState<StockQuote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STOCKS);
      if (saved) {
        const parsed: StockQuote[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Recompute indicators with current custom rules
          return parsed.map((s) => ({
            ...s,
            // Ensure 00632R is always flagged as hedging
            isHedging: s.symbol === '00632R.TW' || s.isHedging,
            indicators: computeIndicators(s.history, s.price, customRules),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved stocks:', e);
    }
    return createInitialWatchlist();
  });

  // UI state
  const [mode, setMode] = useState<AppMode>('intraday');
  const [currentTab, setCurrentTab] = useState<'watchlist' | 'resonance' | 'hedging' | 'daily500'>(
    'watchlist'
  );
  const [taiwanColorMode, setTaiwanColorMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COLOR);
    return saved !== null ? saved === 'true' : true; // Taiwan default Red=Up, Green=Down
  });

  // Active modals
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [linePushStock, setLinePushStock] = useState<StockQuote | null>(null);
  const [isCustomRulesOpen, setIsCustomRulesOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchDiagnosisResult | null>(null);

  // Loading flags
  const [isBatchDiagnosing, setIsBatchDiagnosing] = useState(false);
  const [isDiagnosingSymbol, setIsDiagnosingSymbol] = useState<string | null>(null);
  const [isLiveUpdating, setIsLiveUpdating] = useState(true);

  // Save to localStorage when stocks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STOCKS, JSON.stringify(stocks));
    } catch (e) {
      console.error('Failed to save stocks to storage:', e);
    }
  }, [stocks]);

  // Save color mode preference
  const toggleColorMode = () => {
    const next = !taiwanColorMode;
    setTaiwanColorMode(next);
    localStorage.setItem(STORAGE_KEY_COLOR, String(next));
  };

  // Recompute all indicators when custom rules update
  const handleSaveCustomRules = (newRules: CustomRules) => {
    setCustomRules(newRules);
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(newRules));

    setStocks((prev) =>
      prev.map((s) => ({
        ...s,
        indicators: computeIndicators(s.history, s.price, newRules),
      }))
    );
  };

  const handleResetCustomRules = () => {
    setCustomRules(DEFAULT_CUSTOM_RULES);
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(DEFAULT_CUSTOM_RULES));
    setStocks((prev) =>
      prev.map((s) => ({
        ...s,
        indicators: computeIndicators(s.history, s.price, DEFAULT_CUSTOM_RULES),
      }))
    );
  };

  // Live simulation tick update (when in intraday mode)
  useEffect(() => {
    if (!isLiveUpdating || mode !== 'intraday') return;

    const interval = setInterval(() => {
      setStocks((prevStocks) => {
        // Pick 1-2 random stocks to receive a small tick
        const countToUpdate = Math.random() > 0.4 ? 1 : 2;
        const next = [...prevStocks];

        for (let i = 0; i < countToUpdate; i++) {
          const randomIndex = Math.floor(Math.random() * next.length);
          const target = next[randomIndex];
          const tick = getTickSize(target.price);
          // Direction: -1, 0, or +1
          const dir = Math.random() > 0.45 ? 1 : -1;
          const newPrice = Math.max(
            0.1,
            Math.round((target.price + dir * tick) * 100) / 100
          );
          const diff = newPrice - target.previousClose;
          const pct = Math.round((diff / target.previousClose) * 10000) / 100;

          // Update current bar
          const updatedHistory = [...target.history];
          if (updatedHistory.length > 0) {
            const lastBar = { ...updatedHistory[updatedHistory.length - 1] };
            lastBar.close = newPrice;
            lastBar.high = Math.max(lastBar.high, newPrice);
            lastBar.low = Math.min(lastBar.low, newPrice);
            updatedHistory[updatedHistory.length - 1] = lastBar;
          }

          next[randomIndex] = {
            ...target,
            price: newPrice,
            change: Math.round(diff * 100) / 100,
            changePercent: pct,
            history: updatedHistory,
            indicators: computeIndicators(updatedHistory, newPrice, customRules),
          };
        }

        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveUpdating, mode, customRules]);

  // Manual refresh
  const handleManualRefresh = () => {
    setStocks((prev) =>
      prev.map((s) => ({
        ...s,
        indicators: computeIndicators(s.history, s.price, customRules),
      }))
    );
  };

  // Add stock
  const handleAddStock = (newStock: StockQuote) => {
    setStocks((prev) => {
      const filtered = prev.filter((s) => s.symbol !== newStock.symbol);
      return [...filtered, newStock];
    });
  };

  // Delete stock
  const handleDeleteStock = (symbol: string) => {
    // 00632R and 2330 are protected defaults
    if (symbol === '00632R.TW' || symbol === '2330.TW') return;
    setStocks((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  // Call server-side Gemini AI diagnosis for single stock
  const handleDiagnoseStock = async (stock: StockQuote) => {
    setIsDiagnosingSymbol(stock.symbol);
    try {
      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: {
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            ma5: stock.indicators.ma5,
            ma10: stock.indicators.ma10,
            ma20: stock.indicators.ma20,
            ma60: stock.indicators.ma60,
            squeeze: stock.indicators.squeeze,
            maSlope20: stock.indicators.maSlope20,
            maSlope60: stock.indicators.maSlope60,
            k: stock.indicators.k,
            d: stock.indicators.d,
            macdOsc: stock.indicators.macdOsc,
            bollUpper: stock.indicators.bollUpper,
            bollLower: stock.indicators.bollLower,
            bandwidth: stock.indicators.bandwidth,
            isBreakout: stock.indicators.isBreakout,
            isMomentumBull: stock.indicators.isMomentumBull,
            isBollBreakout: stock.indicators.isBollBreakout,
            isHedging: stock.isHedging || stock.symbol === '00632R.TW',
          },
          mode,
          customRules,
        }),
      });

      const data = await response.json();
      if (response.ok && data.summary) {
        const diag: AIDiagnosis = {
          summary: data.summary,
          stance: data.stance || '區間震盪',
          defensePrice: data.defensePrice || stock.indicators.ma20 || stock.price * 0.98,
          confidence: data.confidence || 80,
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
          source: data.source,
        };

        setStocks((prev) =>
          prev.map((s) => (s.symbol === stock.symbol ? { ...s, aiDiagnosis: diag } : s))
        );

        // Update selected stock if currently in modal
        if (selectedStock && selectedStock.symbol === stock.symbol) {
          setSelectedStock((prev) => (prev ? { ...prev, aiDiagnosis: diag } : null));
        }
      }
    } catch (e) {
      console.error('Diagnosis failed:', e);
    } finally {
      setIsDiagnosingSymbol(null);
    }
  };

  // Call server-side Gemini AI Batch diagnosis
  const handleBatchDiagnose = async () => {
    setIsBatchDiagnosing(true);
    try {
      const response = await fetch('/api/gemini/batch-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: stocks.map((s) => ({
            symbol: s.symbol,
            name: s.name,
            price: s.price,
            changePercent: s.changePercent,
            isBreakout: s.indicators.isBreakout,
            isMomentumBull: s.indicators.isMomentumBull,
            isBollBreakout: s.indicators.isBollBreakout,
            squeeze: s.indicators.squeeze,
            maSlope20: s.indicators.maSlope20,
            maSlope60: s.indicators.maSlope60,
            isHedging: s.isHedging || s.symbol === '00632R.TW',
          })),
          mode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setBatchResult({
          marketOverview: data.marketOverview || '盤勢均線維持多頭架構，糾結突破與動能持續釋放。',
          actionPlan: data.actionPlan || '突破標的持股續抱，未表態標的回測月線低接，避險部位依大盤季線機動調配。',
          topPicks: data.topPicks || [],
          timestamp: new Date().toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }
    } catch (e) {
      console.error('Batch diagnose failed:', e);
    } finally {
      setIsBatchDiagnosing(false);
    }
  };

  // Open line push modal with target stock
  const handleOpenLinePush = (stock: StockQuote) => {
    setLinePushStock(stock);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Bar and Workspace Toolbar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mode={mode}
        onToggleMode={setMode}
        onOpenCustomRules={() => setIsCustomRulesOpen(true)}
        onBatchDiagnose={handleBatchDiagnose}
        isBatchDiagnosing={isBatchDiagnosing}
        onManualRefresh={handleManualRefresh}
        isLiveUpdating={isLiveUpdating}
        onToggleLive={() => setIsLiveUpdating(!isLiveUpdating)}
        taiwanColorMode={taiwanColorMode}
        onToggleColorMode={toggleColorMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs (Mobile View / Segmented Bar) */}
        <div className="lg:hidden flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentTab('watchlist')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentTab === 'watchlist' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            標的清單
          </button>
          <button
            onClick={() => setCurrentTab('resonance')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentTab === 'resonance' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            多頭共振
          </button>
          <button
            onClick={() => setCurrentTab('hedging')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentTab === 'hedging' ? 'bg-purple-600 text-white' : 'text-purple-400'
            }`}
          >
            00632R 避險
          </button>
          <button
            onClick={() => setCurrentTab('daily500')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              currentTab === 'daily500' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
            }`}
          >
            每日賺500元
          </button>
        </div>

        {/* Tab 1: Watchlist & Technical Matrix */}
        {currentTab === 'watchlist' && (
          <WatchlistTable
            stocks={stocks}
            taiwanColorMode={taiwanColorMode}
            onSelectStock={setSelectedStock}
            onDiagnoseStock={handleDiagnoseStock}
            onOpenLinePush={handleOpenLinePush}
            onAddStock={() => setIsImportExportOpen(true)}
            onDeleteStock={handleDeleteStock}
            onOpenImport={() => setIsImportExportOpen(true)}
            onExportData={() => setIsImportExportOpen(true)}
            isDiagnosingSymbol={isDiagnosingSymbol}
          />
        )}

        {/* Tab 2: Bull Resonance Scanner (Excluding 00632R) */}
        {currentTab === 'resonance' && (
          <ResonanceScanner
            stocks={stocks}
            taiwanColorMode={taiwanColorMode}
            onSelectStock={setSelectedStock}
            onDiagnoseStock={handleDiagnoseStock}
            onOpenLinePush={handleOpenLinePush}
          />
        )}

        {/* Tab 3: Dedicated 00632R Hedging Module */}
        {currentTab === 'hedging' && (
          <HedgingModule
            stocks={stocks}
            onDiagnoseStock={handleDiagnoseStock}
            onOpenLinePush={handleOpenLinePush}
            onSelectStock={setSelectedStock}
          />
        )}

        {/* Tab 4: Daily 500 NTD Target Calculator */}
        {currentTab === 'daily500' && (
          <Daily500Calculator
            stocks={stocks}
            customRules={customRules}
            taiwanColorMode={taiwanColorMode}
            onOpenLinePush={handleOpenLinePush}
            onDiagnoseStock={handleDiagnoseStock}
          />
        )}
      </main>

      {/* Modals */}
      <StockDetailModal
        isOpen={selectedStock !== null}
        onClose={() => setSelectedStock(null)}
        stock={selectedStock}
        mode={mode}
        taiwanColorMode={taiwanColorMode}
        onDiagnose={handleDiagnoseStock}
        isDiagnosing={isDiagnosingSymbol === selectedStock?.symbol}
        onOpenLinePush={handleOpenLinePush}
      />

      <LinePushModal
        isOpen={linePushStock !== null}
        onClose={() => setLinePushStock(null)}
        stock={linePushStock}
        mode={mode}
      />

      <CustomStrategyModal
        isOpen={isCustomRulesOpen}
        onClose={() => setIsCustomRulesOpen(false)}
        rules={customRules}
        onSaveRules={handleSaveCustomRules}
        onResetRules={handleResetCustomRules}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        stocks={stocks}
        onAddStock={handleAddStock}
        onImportStocks={(imported) => setStocks(imported)}
      />

      <BatchDiagnosisModal
        isOpen={batchResult !== null}
        onClose={() => setBatchResult(null)}
        result={batchResult}
        stocks={stocks}
        onOpenLinePush={handleOpenLinePush}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 font-mono">
        台股量化指標追蹤與 AI 戰略診斷系統 · 純前端量化數學計算引擎 · 嚴格排除 00632R 獨立避險部位
      </footer>
    </div>
  );
}
