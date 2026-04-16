export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Unauthorized" });
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.status(401).json({ error: "Unauthorized" });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN_ANALYSIS || process.env.GITHUB_PAT || "";
  const REPO = "yonesanbiz/writevideo-dashboard";
  const { id } = req.query;

  try {
    if (id) {
      // 個別の分析結果を取得
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/analysis/${id}.json`, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
      });
      if (!r.ok) return res.status(404).json({ error: "Not found" });
      const data2 = await r.json();
      const content = JSON.parse(Buffer.from(data2.content, "base64").toString());
      return res.status(200).json(content);
    } else {
      // インデックス一覧を取得
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/analysis/index.json`, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
      });
      if (!r.ok) return res.status(200).json({ index: [] });
      const data2 = await r.json();
      const index = JSON.parse(Buffer.from(data2.content, "base64").toString());
      return res.status(200).json({ index });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
