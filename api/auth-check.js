// 共通認証チェック関数
export function checkAuth(req, res) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) { res.status(401).json({ error: "Unauthorized" }); return false; }
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (data.auth) return true;
  } catch {}
  res.status(401).json({ error: "Unauthorized" });
  return false;
}
