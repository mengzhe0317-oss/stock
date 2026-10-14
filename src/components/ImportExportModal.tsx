import React, { useState } from 'react';
import { StockQuote, KLineBar } from '../types/stock';
import { computeIndicators, DEFAULT_CUSTOM_RULES } from '../utils/indicators';
import {
  Upload,
  Download,
  Plus,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockQuote[];
  onAddStock: (stock: StockQuote) => void;
  onImportStocks: (stocks: StockQuote[]) => void;
}

const PRESET_STOCKS = [
  { symbol: '2603.TW', name: '長榮', category: '航運權值', price: 198.5 },
  { symbol: '3008.TW', name: '大立光', category: '光學元件', price: 2580 },
  { symbol: '2382.TW', name: '廣達', category: 'AI伺服器', price: 295.0 },
  { symbol: '3231.TW', name: '緯創', category: 'AI伺服器', price: 118.0 },
  { symbol: '2308.TW', name: '台達電', category: '綠能/伺服電源', price: 412.0 },
  { symbol: '2881.TW', name: '富邦金', category: '金融權值', price: 92.5 },
];

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  stocks,
  onAddStock,
  onImportStocks,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'add' | 'import' | 'export'>('add');

  // Add stock state
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('自訂自選股');
  const [addError, setAddError] = useState('');

  // Import state
  const [csvText, setCsvText] = useState('');
  const [importSymbol, setImportSymbol] = useState('');
  const [importName, setImportName] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleQuickAddPreset = (preset: (typeof PRESET_STOCKS)[0]) => {
    if (stocks.some((s) => s.symbol === preset.symbol)) {
      setAddError(`代碼 ${preset.symbol} 已存在於清單中`);
      return;
    }

    // Generate historical baseline
    const history: KLineBar[] = [];
    let p = preset.price * 0.95;
    const now = new Date();
    for (let i = 45; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const change = (Math.sin(i * 0.4) + 0.1) * (preset.price * 0.015);
      p = Math.max(1, p + change);
      history.push({
        date: d.toISOString().split('T')[0],
        open: Math.round(p * 10) / 10,
        high: Math.round((p + preset.price * 0.01) * 10) / 10,
        low: Math.round((p - preset.price * 0.01) * 10) / 10,
        close: Math.round(p * 10) / 10,
        volume: Math.round(5000 + Math.random() * 15000),
      });
    }

    const prev = history[history.length - 2]?.close || preset.price;
    const newStock: StockQuote = {
      symbol: preset.symbol,
      name: preset.name,
      category: preset.category,
      price: preset.price,
      change: Math.round((preset.price - prev) * 100) / 100,
      changePercent: Math.round(((preset.price - prev) / prev) * 10000) / 100,
      open: preset.price * 0.99,
      high: preset.price * 1.01,
      low: preset.price * 0.985,
      volume: 12000,
      previousClose: prev,
      history,
      isHedging: false,
      indicators: computeIndicators(history, preset.price, DEFAULT_CUSTOM_RULES),
    };

    onAddStock(newStock);
    onClose();
  };

  const handleCustomAdd = () => {
    setAddError('');
    if (!newSymbol.trim()) {
      setAddError('請輸入股票代碼 (例如 2603.TW)');
      return;
    }
    if (!newName.trim()) {
      setAddError('請輸入股票名稱');
      return;
    }
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setAddError('請輸入有效的股價數值');
      return;
    }

    const formattedSymbol = newSymbol.includes('.') ? newSymbol : `${newSymbol}.TW`;
    if (stocks.some((s) => s.symbol.toUpperCase() === formattedSymbol.toUpperCase())) {
      setAddError('該標的已存在於清單中');
      return;
    }

    const history: KLineBar[] = [];
    let p = priceNum * 0.96;
    const now = new Date();
    for (let i = 45; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      p = Math.max(1, p + (Math.sin(i * 0.5) + 0.1) * (priceNum * 0.015));
      history.push({
        date: d.toISOString().split('T')[0],
        open: Math.round(p * 10) / 10,
        high: Math.round((p + priceNum * 0.01) * 10) / 10,
        low: Math.round((p - priceNum * 0.01) * 10) / 10,
        close: Math.round(p * 10) / 10,
        volume: 8000,
      });
    }

    const prev = history[history.length - 2]?.close || priceNum;
    const isHedging = formattedSymbol.startsWith('00632R');

    const newStock: StockQuote = {
      symbol: formattedSymbol,
      name: newName.trim(),
      category: newCategory.trim() || '自訂標的',
      price: priceNum,
      change: Math.round((priceNum - prev) * 100) / 100,
      changePercent: Math.round(((priceNum - prev) / prev) * 10000) / 100,
      open: priceNum * 0.99,
      high: priceNum * 1.01,
      low: priceNum * 0.985,
      volume: 10000,
      previousClose: prev,
      history,
      isHedging,
      indicators: computeIndicators(history, priceNum, DEFAULT_CUSTOM_RULES),
    };

    onAddStock(newStock);
    onClose();
  };

  const handleParseCsv = () => {
    try {
      if (!csvText.trim()) {
        setImportStatus('❌ 請貼上 CSV 文字內容');
        return;
      }
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setImportStatus('❌ CSV 內容行數不足');
        return;
      }

      // Format: Date,Open,High,Low,Close,Volume
      const parsedBars: KLineBar[] = [];
      const startIndex = lines[0].toLowerCase().includes('date') || lines[0].includes('日期') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 5) {
          const date = parts[0];
          const open = parseFloat(parts[1]);
          const high = parseFloat(parts[2]);
          const low = parseFloat(parts[3]);
          const close = parseFloat(parts[4]);
          const volume = parts[5] ? parseFloat(parts[5]) : 10000;

          if (!isNaN(close)) {
            parsedBars.push({ date, open, high, low, close, volume });
          }
        }
      }

      if (parsedBars.length === 0) {
        setImportStatus('❌ 無法解析有效 K 線數據');
        return;
      }

      const sym = importSymbol.trim() || 'CUSTOM.TW';
      const nm = importName.trim() || '匯入標的';
      const latestBar = parsedBars[parsedBars.length - 1];
      const prevBar = parsedBars.length >= 2 ? parsedBars[parsedBars.length - 2] : latestBar;

      const isHedging = sym.includes('00632R');
      const importedStock: StockQuote = {
        symbol: sym,
        name: nm,
        category: 'CSV匯入標的',
        price: latestBar.close,
        change: Math.round((latestBar.close - prevBar.close) * 100) / 100,
        changePercent:
          Math.round(((latestBar.close - prevBar.close) / (prevBar.close || 1)) * 10000) / 100,
        open: latestBar.open,
        high: latestBar.high,
        low: latestBar.low,
        volume: latestBar.volume,
        previousClose: prevBar.close,
        history: parsedBars,
        isHedging,
        indicators: computeIndicators(parsedBars, latestBar.close, DEFAULT_CUSTOM_RULES),
      };

      onAddStock(importedStock);
      setImportStatus('✅ 成功匯入標的與量化指標！');
      setTimeout(() => onClose(), 800);
    } catch (e: any) {
      setImportStatus(`❌ 解析錯誤：${e.message}`);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(stocks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taiwan_stock_quant_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    // Export indicator overview table to CSV
    const headers = [
      '代碼',
      '名稱',
      '現價',
      '漲跌',
      '漲跌幅%',
      '5MA',
      '20MA',
      '60MA',
      '均線糾結度%',
      '糾結突破訊號',
      '動能翻多訊號',
      '布林突破訊號',
      '獨立避險部位',
    ];

    const rows = stocks.map((s) => [
      s.symbol,
      s.name,
      s.price,
      s.change,
      s.changePercent,
      s.indicators.ma5.toFixed(2),
      s.indicators.ma20.toFixed(2),
      s.indicators.ma60.toFixed(2),
      s.indicators.squeeze.toFixed(2),
      s.indicators.isBreakout ? '是' : '否',
      s.indicators.isMomentumBull ? '是' : '否',
      s.indicators.isBollBreakout ? '是' : '否',
      s.isHedging ? '是' : '否',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `台股量化指標矩陣_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">標的管理與數據交換</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'add'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ＋ 新增標的
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📥 匯入 K 線 (CSV)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📤 匯出資料
          </button>
        </div>

        {/* Tab 1: Add Stock */}
        {activeTab === 'add' && (
          <div className="p-5 space-y-4 text-xs">
            {/* Quick Presets */}
            <div>
              <div className="text-slate-400 font-semibold mb-2">台股熱門權值標的快速加入</div>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_STOCKS.map((p) => {
                  const exists = stocks.some((s) => s.symbol === p.symbol);
                  return (
                    <button
                      key={p.symbol}
                      onClick={() => !exists && handleQuickAddPreset(p)}
                      disabled={exists}
                      className={`p-2 rounded-lg text-left border transition-all ${
                        exists
                          ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-indigo-500'
                      }`}
                    >
                      <div className="font-bold">{p.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{p.symbol}</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">
                        {exists ? '已在清單' : `$${p.price}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="font-semibold text-slate-200">手動輸入自選股票</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    股票代碼 (如 2603.TW)
                  </label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="2603.TW"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">名稱 (如 長榮)</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="長榮"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">現價 (元)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="198.5"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">族群類別</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="航運"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {addError && <div className="text-rose-400 text-xs">{addError}</div>}

              <button
                onClick={handleCustomAdd}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
              >
                加入自選觀察池並計算指標
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import CSV */}
        {activeTab === 'import' && (
          <div className="p-5 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">股票代碼</label>
                <input
                  type="text"
                  value={importSymbol}
                  onChange={(e) => setImportSymbol(e.target.value)}
                  placeholder="2330.TW"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">股票名稱</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="台積電"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">
                  貼上歷史 K 線 CSV (Date,Open,High,Low,Close,Volume)
                </label>
                <button
                  onClick={() =>
                    setCsvText(`Date,Open,High,Low,Close,Volume
2026-09-01,1020,1035,1015,1030,28500
2026-09-02,1030,1040,1025,1038,31200
2026-09-03,1035,1050,1030,1045,39800`)
                  }
                  className="text-xs text-indigo-400 hover:underline"
                >
                  填入範例格式
                </button>
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="2026-09-01,1020,1035,1015,1030,28500..."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {importStatus && (
              <div className="text-xs font-mono p-2 bg-slate-950 rounded border border-slate-800">
                {importStatus}
              </div>
            )}

            <button
              onClick={handleParseCsv}
              className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              解析並匯入指標運算池
            </button>
          </div>
        )}

        {/* Tab 3: Export */}
        {activeTab === 'export' && (
          <div className="p-6 space-y-4 text-xs">
            <p className="text-slate-300">
              您可以匯出當前所有觀察清單的計算指標矩陣 (均線、糾結度、KD、MACD、布林) 或完整歷史 JSON：
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportCSV}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 text-left transition-all"
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>匯出 CSV 報表</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  包含當日收盤、均線糾結度、突破警示燈與各項量化數值
                </div>
              </button>

              <button
                onClick={handleExportJSON}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 text-left transition-all"
              >
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>匯出完整 JSON</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  包含 90 日歷史 K 線明細與所有標的狀態
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
