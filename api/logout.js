export default async function handler(req, res) {
  res.setHeader('Set-Cookie', [
    'wv_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict',
    'wv_code=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
  ]);
  res.status(200).json({ success: true });
}
