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

  const messages = getSlackData();

  // チャンネル一覧取得
  if (req.method === "GET") {
    const channelMap = {};
    for (const m of messages) {
      if (!channelMap[m.ch]) channelMap[m.ch] = 0;
      channelMap[m.ch]++;
    }
    const channels = Object.entries(channelMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return res.status(200).json({ channels });
  }

  // チャンネルのメッセージ取得
  if (req.method === "POST") {
    const { channel, limit = 50 } = req.body;
    if (!channel) return res.status(400).json({ error: "channel required" });

    const msgs = messages
      .filter(m => m.ch === channel)
      .sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts))
      .slice(0, parseInt(limit))
      .map(m => ({
        text: m.text,
        user: m.user,
        date: new Date(parseFloat(m.ts) * 1000).toLocaleString("ja-JP"),
        ts: m.ts,
      }));

    return res.status(200).json({ messages: msgs, total: messages.filter(m => m.ch === channel).length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
