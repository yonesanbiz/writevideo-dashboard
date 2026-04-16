import { checkAuth } from './auth-check.js';
import fs from "fs";
import path from "path";

let slackData = null;
let usersMap = null;
let slackDataMtime = 0;

function getSlackData() {
  const p = path.join(process.cwd(), "slack_data_clean.json");
  const mtime = fs.statSync(p).mtimeMs;
  if (!slackData || mtime !== slackDataMtime) {
    slackData = JSON.parse(fs.readFileSync(p, "utf-8"));
    slackDataMtime = mtime;
  }
  return slackData;
}

function getUsersMap() {
  if (!usersMap) {
    try {
      const p = path.join(process.cwd(), "users_map.json");
      usersMap = JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch { usersMap = {}; }
  }
  return usersMap;
}

export default async function handler(req, res) {
  // 認証チェック
  if (!checkAuth(req, res)) return;

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
    return res.status(200).json({ channels, users: getUsersMap() });
  }

  // チャンネルのメッセージ取得
  if (req.method === "POST") {
    const { channel, limit = 50 } = req.body;
    if (!channel) return res.status(400).json({ error: "channel required" });

    const { keyword } = req.body;
    const allInChannel = messages
      .filter(m => m.ch === channel)
      .sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));

    // キーワードがある場合は全件から検索、ない場合はlimit件
    const filtered = keyword
      ? allInChannel.filter(m => m.text && m.text.includes(keyword))
      : allInChannel.slice(0, parseInt(limit));

    const msgs = filtered.map(m => ({
      text: m.text,
      user: m.user || m.username || m.display_name || "不明",
      date: new Date(parseFloat(m.ts) * 1000).toLocaleString("ja-JP"),
      ts: m.ts,
      thread_ts: m.thread_ts || null,
    }));

    return res.status(200).json({ messages: msgs, total: allInChannel.length, matched: filtered.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
