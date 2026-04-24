import { checkAuth } from './auth-check.js';

const BLOB_BASE = 'https://gb3xnd1ythqwm0kh.private.blob.vercel-storage.com';
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';

async function fetchLayout() {
  try {
    const res = await fetch(`${BLOB_BASE}/config/dashboard-layout.json`, {
      headers: { 'Authorization': `Bearer ${BLOB_TOKEN}` }
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function saveLayout(order) {
  const res = await fetch(`${BLOB_BASE}/config/dashboard-layout.json`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${BLOB_TOKEN}`,
      'x-api-version': '7',
      'content-type': 'application/json',
      'x-add-random-suffix': '0',
      'x-access': 'private',
    },
    body: JSON.stringify({ order, updatedAt: new Date().toISOString() })
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const layout = await fetchLayout();
    return res.status(200).json(layout || { order: null });
  }

  if (req.method === 'POST') {
    const { order } = req.body;
    if (!order || !Array.isArray(order)) return res.status(400).json({ error: 'order required' });
    const ok = await saveLayout(order);
    return res.status(ok ? 200 : 500).json({ ok });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
