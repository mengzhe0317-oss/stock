import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize server-side Gemini AI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Diagnostic API for single stock
app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const { stock, mode, customRules } = req.body;

    if (!stock) {
      return res.status(400).json({ error: 'Missing stock data' });
    }

    if (!ai) {
      // Return a calculated rule-based diagnosis if API key is not yet set
      const isHedging = stock.symbol === '00632R.TW' || stock.isHedging;
      let stance = '中立觀望';
      let defense = stock.ma20 ? Number(stock.ma20.toFixed(2)) : stock.price * 0.97;
      let advice = '';

      if (isHedging) {
        stance = '獨立避險';
        defense = Number((stock.price * 0.95).toFixed(2));
        advice = `00632R為獨立避險部位，不納入多頭。當大盤破月線時可增持避險，防守價設在 ${defense} 元。`;
      } else if (stock.isBreakout && stock.isMomentumBull) {
        stance = '強勢進攻';
        defense = stock.ma10 ? Number(stock.ma10.toFixed(2)) : Number((stock.price * 0.97).toFixed(2));
        advice = `均線糾結帶量突破且KD/MACD動能翻多，屬強多共振格局。建議順勢布局，防守看 ${defense} 元。`;
      } else if (stock.isBreakout) {
        stance = '糾結突破';
        defense = stock.ma20 ? Number(stock.ma20.toFixed(2)) : Number((stock.price * 0.98).toFixed(2));
        advice = `均線糾結度緊縮後發動突破，留意布林上軌壓力。防守支撐設於月線 ${defense} 元。`;
      } else if (stock.isMomentumBull) {
        stance = '動能翻多';
        defense = stock.ma20 ? Number(stock.ma20.toFixed(2)) : Number((stock.price * 0.97).toFixed(2));
        advice = `季線支撐向上且指標黃金交叉，短線動能增強，回測月線 ${defense} 元不破可分批觀察。`;
      } else {
        stance = stock.price < stock.ma20 ? '偏弱整理' : '區間震盪';
        defense = stock.ma60 ? Number(stock.ma60.toFixed(2)) : Number((stock.price * 0.95).toFixed(2));
        advice = `現階段未見明確共振訊號，維持區間操作或觀望，關鍵防守價看季線 ${defense} 元。`;
      }

      return res.json({
        summary: advice,
        stance,
        defensePrice: defense,
        confidence: stock.isBreakout && stock.isMomentumBull ? 92 : 75,
        source: 'rule-based',
      });
    }

    const isHedging = stock.symbol === '00632R.TW' || stock.isHedging;

    const prompt = `
你是一位擁有20年台股實戰操盤經驗的資深量化交易員。
請嚴格根據以下提供的真實技術指標數據（禁止捏造非給定的數據）：

【標的】：${stock.name} (${stock.symbol})
【即時/收盤現價】：${stock.price} (漲跌 ${stock.change >= 0 ? '+' : ''}${stock.change} / ${stock.changePercent}%)
【均線數據】：5MA: ${stock.ma5?.toFixed(2) || 'N/A'}, 10MA: ${stock.ma10?.toFixed(2) || 'N/A'}, 20MA(月線): ${stock.ma20?.toFixed(2) || 'N/A'}, 60MA(季線): ${stock.ma60?.toFixed(2) || 'N/A'}
【均線糾結度】：${stock.squeeze?.toFixed(2) || 'N/A'}% (突破狀態: ${stock.isBreakout ? '已觸發均線糾結突破' : '未觸發'})
【趨勢方向】：20MA: ${stock.maSlope20 || '持平'}, 60MA: ${stock.maSlope60 || '持平'}
【動能指標】：KD(9,3,3) K值: ${stock.k?.toFixed(1) || 'N/A'}, D值: ${stock.d?.toFixed(1) || 'N/A'}; MACD柱狀體(OSC): ${stock.macdOsc?.toFixed(3) || 'N/A'} (動能翻多訊號: ${stock.isMomentumBull ? '是' : '否'})
【布林通道】：上軌: ${stock.bollUpper?.toFixed(2) || 'N/A'}, 下軌: ${stock.bollLower?.toFixed(2) || 'N/A'}, 帶寬: ${stock.bandwidth?.toFixed(2) || 'N/A'}% (布林突破: ${stock.isBollBreakout ? '是' : '否'})
【模式】：${mode === 'intraday' ? '⚡ 盤中即時監控' : '📊 盤後定時掃描'}
【特別標記】：${isHedging ? '⚠️ 這是【00632R.TW 元大台灣50反1】獨立避險部位！絕不可給予常規多頭選股追價建議，請針對大盤避險避險對沖提出配置看法。' : '常規多頭/空頭交易部位'}

【要求】：
1. 嚴格限制在 80 個中文字以內！
2. 必須給出明確的「實戰操作建議」與「具體防守/停損價位」。
3. 語氣果決、專業、乾淨俐落，直指量化核心。
4. 請以繁體中文回答，遵守 JSON 格式輸出：
{
  "summary": "80字以內的建議與防守價說明",
  "stance": "強勢進攻 / 糾結突破 / 動能翻多 / 區間震盪 / 偏弱偏空 / 獨立避險",
  "defensePrice": 數值防守價,
  "confidence": 0到100的量化勝率信賴度
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      parsedResult = {
        summary: text.slice(0, 80),
        stance: stock.isBreakout ? '強勢進攻' : '技術整理',
        defensePrice: stock.ma20 ? Number(stock.ma20.toFixed(2)) : stock.price * 0.98,
        confidence: 80,
      };
    }

    res.json({
      ...parsedResult,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Gemini diagnose error:', error);
    res.status(500).json({ error: error.message || 'AI diagnosis failed' });
  }
});

// Batch Diagnostic Summary API
app.post('/api/gemini/batch-diagnose', async (req, res) => {
  try {
    const { stocks, mode } = req.body;
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: 'No stock list provided' });
    }

    if (!ai) {
      // Mock / Rule-based batch overview
      const nonHedging = stocks.filter((s) => s.symbol !== '00632R.TW');
      const breakoutCount = nonHedging.filter((s) => s.isBreakout).length;
      const momentumCount = nonHedging.filter((s) => s.isMomentumBull).length;

      return res.json({
        marketOverview: `當前台股監控標的中，多頭共振共 ${breakoutCount} 檔突破、${momentumCount} 檔動能翻多。避險部位 00632R 獨立監控。`,
        actionPlan: '強勢股嚴守5日線續抱，未表態標的回測月線低接，避險部位隨加權指數季線動態調整。',
        topPicks: nonHedging.filter((s) => s.isBreakout || s.isMomentumBull).map((s) => s.symbol),
        source: 'rule-based',
      });
    }

    // Filter out 00632R from bull picks
    const bullCandidates = stocks.filter((s: any) => s.symbol !== '00632R.TW');
    const hedgeStock = stocks.find((s: any) => s.symbol === '00632R.TW');

    const prompt = `
你是專業台股頂級自營部操盤人。請分析以下這批台股觀察清單與量化指標狀態：
多頭篩選清單（已強制排除 00632R.TW 避險標的）：
${JSON.stringify(
  bullCandidates.map((s: any) => ({
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    changePercent: s.changePercent,
    isBreakout: s.isBreakout,
    isMomentumBull: s.isMomentumBull,
    isBollBreakout: s.isBollBreakout,
    squeeze: s.squeeze?.toFixed(2) + '%',
    maSlope20: s.maSlope20,
    maSlope60: s.maSlope60,
  }))
)}

獨立避險部位：
${hedgeStock ? JSON.stringify({ symbol: hedgeStock.symbol, price: hedgeStock.price, changePercent: hedgeStock.changePercent }) : '無'}

請以 120 字以內繁體中文總結全局戰略（包含多頭勝率評估、部位防守線索與避險策略）：
輸出 JSON:
{
  "marketOverview": "100字內全局盤勢精闢診斷",
  "actionPlan": "即戰力操盤指令",
  "topPicks": ["精選出1-2檔代號"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      ...parsed,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Batch diagnose error:', error);
    res.status(500).json({ error: error.message || 'Batch diagnosis failed' });
  }
});

// Proxy route for LINE notify / Webhook dispatch
app.post('/api/line/push-preview-dispatch', async (req, res) => {
  try {
    const { endpoint, token, message, title } = req.body;
    if (!endpoint) {
      // Simulation mode
      return res.json({
        success: true,
        mode: 'simulated',
        message: '推播訊息已模擬發送成功（可填入自訂 Cloudflare Worker 或 Webhook URL 進行即時實體推播）',
        deliveredAt: new Date().toISOString(),
      });
    }

    // Real dispatch to user-provided Worker / Webhook
    const fetchResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        title,
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await fetchResponse.text();
    return res.json({
      success: fetchResponse.ok,
      status: fetchResponse.status,
      response: data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'LINE Dispatch failed',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
