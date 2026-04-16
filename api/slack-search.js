import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// Slack データをロード
let slackData = null;
function getSlackData() {
  if (!slackData) {
    const p = path.join(process.cwd(), "slack_data_clean.json");
    slackData = JSON.parse(fs.readFileSync(p, "utf-8"));
  }
  return slackData;
}

// キーワードで関連メッセージを抽出
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
      // チャンネル名にも一致したらボーナス
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
  // 認証チェック
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

  try {
    const messages = getSlackData();
    const relevant = searchRelevant(messages, query);

    if (relevant.length === 0) {
      return res.status(200).json({
        answer:
          "関連するメッセージが見つかりませんでした。別のキーワードで試してみてください。",
        sources: [],
      });
    }

    // Claudeに渡すコンテキスト生成
    const context = relevant
      .map((m) => `[#${m.ch}] ${m.text}`)
      .join("\n---\n");

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `以下はWriteVideo.aiの社内Slackの過去メッセージです。これを元に質問に答えてください。

<slack_messages>
${context}
</slack_messages>

質問: ${query}

日本語で簡潔に答えてください。根拠となるメッセージがあれば引用してください。`,
        },
      ],
    });

    const textBlock = response.content.find(b => b.type === "text");
    const answer = textBlock ? textBlock.text : "回答を生成できませんでした";

    // ソース（上位5件）
    const sources = relevant.slice(0, 5).map((m) => ({
      channel: m.ch,
      text: m.text.slice(0, 100) + (m.text.length > 100 ? "..." : ""),
      date: new Date(parseFloat(m.ts) * 1000).toLocaleDateString("ja-JP"),
    }));

    return res.status(200).json({ answer, sources });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
