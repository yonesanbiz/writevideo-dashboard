import { checkAuth } from './auth-check.js';
import fs from 'fs';
import path from 'path';

const BLOB_BASE = 'https://gb3xnd1ythqwm0kh.private.blob.vercel-storage.com';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';

let usersMapCache = null;
function getUsersMap() {
  if (!usersMapCache) {
    try {
      const p = path.join(process.cwd(), 'users_map.json');
      usersMapCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch { usersMapCache = {}; }
  }
  return usersMapCache;
}

let channelIndex = null;
const channelCache = {};

async function fetchBlob(path) {
  const res = await fetch(`${BLOB_BASE}/${path}`, {
    headers: { 'Authorization': `Bearer ${BLOB_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status} ${path}`);
  return res.json();
}

async function getIndex() {
  if (!channelIndex) channelIndex = await fetchBlob('slack/_index.json');
  return channelIndex;
}

async function getChannelData(chName) {
  if (channelCache[chName]) return channelCache[chName];
  const safe = chName.replace(/\//g,'_').replace(/\\/g,'_').replace(/:/g,'_');
  channelCache[chName] = await fetchBlob(`slack/${safe}.json`);
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
        users: getUsersMap()
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
          user: (() => {
            const u = m.user || '';
            if (u.startsWith('U') && u.length > 8) {
              return getUsersMap()[u] || u;
            }
            return u || '不明';
          })(),
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
