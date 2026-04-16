import fs from "fs";
import path from "path";

let slackData = null;
function getSlackData() {
  if (!slackData) {
    const p = path.join(process.cwd(), "slack_data_clean.json");
    slackData = JSON.parse(fs.readFileSync(p, "utf-8"));
  }
  return slackData;
}

function searchRelevant(messages, query, maxResults = 80) {
  const keywords = query
    .toLowerCase()
    .replace(/[？?！!。、]/g, " ")
    .split(/\s+/)
    .filter((k) => k.length >= 2);

  const scored = messages.map((m) => {
    const text = m.text.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 2;
      if (m.ch.includes(kw)) score += 1;
    }
    return { ...m, score };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export default async function handler(req, res) {
  const API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Unauthorized" });
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.status(401).json({ error: "Unauthorized" });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  // デバッグ
  return res.status(200).json({
    apiKeyLength: API_KEY.length,
    apiKeyPrefix: API_KEY.slice(0, 15),
    claudeKey: (process.env.CLAUDE_API_KEY || "MISSING").slice(0, 15),
    anthropicKey: (process.env.ANTHROPIC_API_KEY || "MISSING").slice(0, 15),
  });

  try {
    const messages = getSlackData();
    const relevant = searchRelevant(messages, query);

    if (relevant.length === 0) {
      return res.status(200).json({
        answer: "関連するメッセージが見つかりませんでした。別のキーワードで試してみてください。",
        sources: [],
      });
    }

    const context = relevant.map((m) => `[#${m.ch}] ${m.text}`).join("\n---\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `以下はWriteVideo.aiの社内Slackの過去メッセージです。これを元に質問に答えてください。\n\n<slack_messages>\n${context}\n</slack_messages>\n\n質問: ${query}\n\n日本語で簡潔に答えてください。`,
          },
        ],
      }),
    });

    const data2 = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: data2.error?.message || "API error", status: response.status });
    }

    const answer = data2.content?.[0]?.text || "回答を生成できませんでした";

    const sources = relevant.slice(0, 5).map((m) => ({
      channel: m.ch,
      text: m.text.slice(0, 100) + (m.text.length > 100 ? "..." : ""),
      date: new Date(parseFloat(m.ts) * 1000).toLocaleDateString("ja-JP"),
    }));

    return res.status(200).json({ answer, sources });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
