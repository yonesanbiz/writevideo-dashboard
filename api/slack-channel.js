import { checkAuth } from './auth-check.js';
import { put, get, list } from '@vercel/blob';

let channelIndex = null;
const channelCache = {};

async function getIndex() {
  if (channelIndex) return channelIndex;
  const res = await get('slack/_index.json', { access: 'private' });
  channelIndex = await res.json();
  return channelIndex;
}

async function getChannelData(chName) {
  if (channelCache[chName]) return channelCache[chName];
  const safe = chName.replace(/\//g,'_').replace(/\\/g,'_').replace(/:/g,'_');
  const res = await get(`slack/${safe}.json`, { access: 'private' });
  channelCache[chName] = await res.json();
  return channelCache[chName];
}

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const index = await getIndex();
      return res.status(200).json({
        channels: index.map(ch => ({ name: ch.name, count: ch.count })),
        users: {}
      });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    const { channel, limit = 50, keyword } = req.body;
    if (!channel) return res.status(400).json({ error: "channel required" });
    try {
      const messages = await getChannelData(channel);
      const sorted = [...messages].sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));
      const filtered = keyword
        ? sorted.filter(m => m.text && m.text.includes(keyword))
        : sorted.slice(0, parseInt(limit));
      return res.status(200).json({
        messages: filtered.map(m => ({
          text: m.text,
          user: m.user || "不明",
          date: new Date(parseFloat(m.ts) * 1000).toLocaleString("ja-JP"),
          ts: m.ts,
          thread_ts: m.thread_ts || null,
        })),
        total: messages.length,
        matched: filtered.length
      });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
