import { checkAuth } from './auth-check.js';
import fs from "fs";
import path from "path";

let channelIndex = null;

function getIndex() {
  if (!channelIndex) {
    const p = path.join(process.cwd(), "slack_channels/_index.json");
    channelIndex = JSON.parse(fs.readFileSync(p, "utf-8"));
  }
  return channelIndex;
}

function getChannelData(chName) {
  const safe = chName.replace(/\//g, '_').replace(/\\/g, '_').replace(/:/g, '_');
  const p = path.join(process.cwd(), `slack_channels/${safe}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function getUsersMap() {
  try {
    const p = path.join(process.cwd(), "users_map.json");
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return {}; }
}

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;

  res.setHeader("Cache-Control", "no-store");

  // チャンネル一覧
  if (req.method === "GET") {
    const index = getIndex();
    const channels = index.map(ch => ({ name: ch.name, count: ch.count }));
    return res.status(200).json({ channels, users: getUsersMap() });
  }

  // チャンネルのメッセージ取得
  if (req.method === "POST") {
    const { channel, limit = 50, keyword } = req.body;
    if (!channel) return res.status(400).json({ error: "channel required" });

    const messages = getChannelData(channel);
    const sorted = messages.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));

    const filtered = keyword
      ? sorted.filter(m => m.text && m.text.includes(keyword))
      : sorted.slice(0, parseInt(limit));

    const msgs = filtered.map(m => ({
      text: m.text,
      user: m.user || "不明",
      date: new Date(parseFloat(m.ts) * 1000).toLocaleString("ja-JP"),
      ts: m.ts,
      thread_ts: m.thread_ts || null,
    }));

    return res.status(200).json({ messages: msgs, total: messages.length, matched: filtered.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
