export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/wv_code=([^;]+)/);

  if (!match) return res.status(400).json({ error: 'コードが見つかりません' });

  try {
    const data = JSON.parse(Buffer.from(match[1], 'base64').toString());

    if (Date.now() > data.expiry) {
      return res.status(400).json({ error: 'コードの有効期限が切れています' });
    }

    if (data.code !== code) {
      return res.status(400).json({ error: 'コードが違います' });
    }

    // 認証成功 - セッションcookieをセット
    const sessionData = Buffer.from(JSON.stringify({ email: data.email, auth: true, ts: Date.now() })).toString('base64');
    res.setHeader('Set-Cookie', [
      `wv_session=${sessionData}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
      `wv_code=; HttpOnly; Path=/; Max-Age=0`
    ]);
    res.status(200).json({ success: true, email: data.email });
  } catch (e) {
    res.status(400).json({ error: '無効なコードです' });
  }
}
