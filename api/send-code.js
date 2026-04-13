export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // 6桁のパスコード生成
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10分有効

  // パスコードをcookieに保存（サーバーサイド）
  const codeData = Buffer.from(JSON.stringify({ code, expiry, email })).toString('base64');

  // Resendでメール送信
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'WriteVideo Dashboard <onboarding@resend.dev>',
      to: email,
      subject: 'WriteVideo.ai ダッシュボード ログインコード',
      html: `
        <div style="font-family:monospace;max-width:400px;margin:0 auto;padding:40px 20px;">
          <h2 style="font-size:18px;margin-bottom:8px;">WriteVideo.ai Dashboard</h2>
          <p style="color:#888;font-size:12px;margin-bottom:32px;">Confidential</p>
          <p style="font-size:14px;margin-bottom:16px;">ログインコードです。10分以内に入力してください。</p>
          <div style="background:#f5f2ec;padding:24px;text-align:center;letter-spacing:0.3em;font-size:32px;font-weight:700;">
            ${code}
          </div>
          <p style="color:#aaa;font-size:11px;margin-top:24px;">このメールに心当たりがない場合は無視してください。</p>
        </div>
      `,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.json();
    return res.status(500).json({ error: 'メール送信失敗', detail: err });
  }

  // コードをcookieにセット
  res.setHeader('Set-Cookie', `wv_code=${codeData}; HttpOnly; Path=/; Max-Age=600; SameSite=Strict`);
  res.status(200).json({ success: true });
}
