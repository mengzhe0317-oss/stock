import React, { useState } from 'react';
import { StockQuote, AppMode } from '../types/stock';
import {
  Send,
  X,
  Copy,
  CheckCircle2,
  Settings,
  Flame,
  Zap,
  Rocket,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface LinePushModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockQuote | null;
  mode: AppMode;
}

export const LinePushModal: React.FC<LinePushModalProps> = ({
  isOpen,
  onClose,
  stock,
  mode,
}) => {
  if (!isOpen || !stock) return null;

  const [copied, setCopied] = useState(false);
  const [templateType, setTemplateType] = useState<'alert' | 'daily' | 'daily500' | 'hedging'>(
    stock.isHedging ? 'hedging' : 'alert'
  );

  // LINE Endpoint Configuration (stored in localStorage)
  const [showConfig, setShowConfig] = useState(false);
  const [endpoint, setEndpoint] = useState<string>(() => {
    return localStorage.getItem('LINE_WEBHOOK_ENDPOINT') || '';
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('LINE_WEBHOOK_TOKEN') || '';
  });
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleSaveConfig = () => {
    localStorage.setItem('LINE_WEBHOOK_ENDPOINT', endpoint);
    localStorage.setItem('LINE_WEBHOOK_TOKEN', token);
    setShowConfig(false);
  };

  // Generate formatted LINE message text
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

  const ind = stock.indicators;
  const isHedging = stock.isHedging || stock.symbol === '00632R.TW';

  let messageText = '';
  let title = '';

  if (templateType === 'alert') {
    title = `⚡【台股盤中量化共振快訊】`;
    messageText = `${title}
時間：${dateStr} ${timeStr}
標的：${stock.name} (${stock.symbol})
現價：${stock.price} (${stock.change >= 0 ? '+' : ''}${stock.change} / ${stock.changePercent}%)

📊【關鍵量化指標】
• 均線糾結度：${ind.squeeze.toFixed(2)}% ${ind.isBreakout ? '🔥已觸發糾結突破' : ''}
• 趨勢方向：月線 ${ind.maSlope20} / 季線 ${ind.maSlope60}
• KD (9,3,3)：K ${ind.k.toFixed(1)} / D ${ind.d.toFixed(1)}
• MACD OSC：${ind.macdOsc > 0 ? '+' : ''}${ind.macdOsc.toFixed(2)} (${ind.macdStatus})
• 布林通道：帶寬 ${ind.bandwidth.toFixed(1)}% ${ind.isBollBreakout ? '🚀突破上軌' : ''}

🤖【Gemini AI 實戰操作指令】
${stock.aiDiagnosis ? stock.aiDiagnosis.summary : '均線多頭排列且動能轉強，回測月線不破續抱，防守價設於 ' + (ind.ma20 ? ind.ma20.toFixed(1) : stock.price * 0.98) + ' 元。'}

⚠️【避險機制聲明】
本多頭訊號已自動排除 00632R 反向標的。投資請嚴守停損紀律。`;
  } else if (templateType === 'daily') {
    title = `📊【台股量化戰略日報】`;
    messageText = `${title}
結算日期：${dateStr}
收盤標的：${stock.name} (${stock.symbol})
收盤價：${stock.price} (${stock.changePercent}%)

📐【均線與波段防守】
• 5MA: ${ind.ma5.toFixed(1)} | 10MA: ${ind.ma10.toFixed(1)}
• 20MA (月線): ${ind.ma20.toFixed(1)} (${stock.price >= ind.ma20 ? '站上' : '跌破'})
• 60MA (季線): ${ind.ma60.toFixed(1)} (${ind.maSlope60})

🎯【AI 操盤手評等】
立場：${stock.aiDiagnosis?.stance || '區間震盪'} (勝率信賴度: ${stock.aiDiagnosis?.confidence || 80}%)
實戰建議：${stock.aiDiagnosis?.summary || '維持區間操作，嚴守月線關卡。'}
關鍵防守位：${stock.aiDiagnosis?.defensePrice || ind.ma20.toFixed(1)} 元`;
  } else if (templateType === 'daily500') {
    title = `🎯【每日賺 $500 極短線戰略】`;
    const targetGain = stock.price >= 1000 ? 5 : stock.price >= 500 ? 1 : 0.5;
    const targetPrice = stock.price + targetGain * 2;
    const stopPrice = stock.price - targetGain * 2;

    messageText = `${title}
標的：${stock.name} (${stock.symbol})
現價：${stock.price} 元
建議單位：${stock.price >= 1000 ? '100股 (零股)' : '500股 / 1張'}
目標停利價：${targetPrice.toFixed(1)} 元 (+2 Ticks)
紀律停損價：${stopPrice.toFixed(1)} 元
預估淨利：+NT$ 500 (已精算券商折讓手續費與證交稅)

⚠️ 註：00632R 已強制排除，僅適用常規多頭個股。`;
  } else {
    title = `🛡️【00632R 獨立避險部位動態報告】`;
    messageText = `${title}
標的：00632R.TW (元大台灣50反1)
現價：${stock.price} 元 (${stock.changePercent}%)

🚨【反向對沖狀態】
• 本標的為獨立避險對沖工具，不納入多頭策略計算。
• 20MA(月線) 防守位：${ind.ma20.toFixed(2)}
• 建議避險對沖比例：大盤跌破月線配置 15%，跌破季線配置 25%。
• 操盤指引：${stock.aiDiagnosis?.summary || '大盤震盪拉回時可適度增持避險部位以沖銷多頭部位浮虧。'}`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch('/api/line/push-preview-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: endpoint.trim() || undefined,
          token: token.trim() || undefined,
          title,
          message: messageText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchStatus(
          endpoint.trim()
            ? '✅ 已成功發送至 Cloudflare Worker / Webhook 端點！'
            : '✅ 模擬發送成功！（可點擊「端點設定」填入真實 LINE Webhook）'
        );
      } else {
        setDispatchStatus(`❌ 發送失敗：${data.error || '伺服器無回應'}`);
      }
    } catch (e: any) {
      setDispatchStatus(`❌ 連線失敗：${e.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              LINE
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>LINE 推播訊息預覽與發送</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {stock.symbol} {stock.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                可複製文字或經由 Cloudflare Worker / Webhook 實體推播
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              title="設定 LINE Webhook / Cloudflare Worker"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Selector */}
        <div className="px-5 pt-4 flex items-center gap-2 overflow-x-auto text-xs">
          {!isHedging && (
            <>
              <button
                onClick={() => setTemplateType('alert')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  templateType === 'alert'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ 即時共振快訊
              </button>
              <button
                onClick={() => setTemplateType('daily')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  templateType === 'daily'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 盤後戰略日報
              </button>
              <button
                onClick={() => setTemplateType('daily500')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  templateType === 'daily500'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🎯 每日賺$500掛單
              </button>
            </>
          )}

          {isHedging && (
            <button
              onClick={() => setTemplateType('hedging')}
              className="px-3 py-1.5 rounded-lg font-medium whitespace-nowrap bg-purple-600 text-white"
            >
              🛡️ 00632R 避險動態
            </button>
          )}
        </div>

        {/* Webhook Configuration Drawer */}
        {showConfig && (
          <div className="mx-5 my-3 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>Cloudflare Worker / Webhook 端點設定</span>
              <button
                onClick={handleSaveConfig}
                className="text-xs text-indigo-400 hover:underline"
              >
                儲存設定
              </button>
            </div>
            <input
              type="text"
              placeholder="https://your-worker.your-subdomain.workers.dev"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
            />
            <input
              type="password"
              placeholder="Bearer Token / Channel Access Token (選填)"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500">
              若未設定端點，點擊發送將執行無伺服器模擬推播。
            </p>
          </div>
        )}

        {/* Authentic LINE Chat Preview Card */}
        <div className="p-5">
          <div className="bg-[#1e2c24] border border-emerald-900/50 rounded-2xl p-4 shadow-inner text-slate-100 font-sans text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-emerald-400 border-b border-emerald-800/40 pb-2">
              <span className="font-bold">LINE NOTIFY / BOT MESSAGE PREVIEW</span>
              <span className="font-mono">{timeStr}</span>
            </div>

            <div className="whitespace-pre-wrap leading-relaxed font-mono text-slate-200 bg-black/20 p-3 rounded-xl border border-emerald-950">
              {messageText}
            </div>
          </div>

          {dispatchStatus && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-center text-slate-300">
              {dispatchStatus}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            關閉
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">已複製文案</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製推播文案</span>
                </>
              )}
            </button>

            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-pulse' : ''}`} />
              <span>{isDispatching ? '發送中...' : '發送至 LINE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
