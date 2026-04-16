import { checkAuth } from './auth-check.js';
export default async function handler(req, res) {
  // 認証チェック
  if (!checkAuth(req, res)) return;

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { channel, prompt, result } = req.body;
  if (!channel || !prompt || !result) return res.status(400).json({ error: "channel, prompt, result required" });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN_ANALYSIS || process.env.GITHUB_PAT || "";
  const REPO = "yonesanbiz/writevideo-dashboard";

  try {
    // 既存のanalysis_index.jsonを取得
    let index = [];
    let indexSha = null;
    try {
      const indexRes = await fetch(`https://api.github.com/repos/${REPO}/contents/analysis/index.json`, {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
      });
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        indexSha = indexData.sha;
        index = JSON.parse(Buffer.from(indexData.content, "base64").toString());
      }
    } catch {}

    // 新しいエントリを作成
    const id = `analysis_${Date.now()}`;
    const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    const entry = { id, channel, prompt, createdAt: now };

    // 分析結果ファイルを保存
    const resultContent = Buffer.from(JSON.stringify({ ...entry, result }, null, 2)).toString("base64");
    await fetch(`https://api.github.com/repos/${REPO}/contents/analysis/${id}.json`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Add analysis: ${channel} - ${prompt.slice(0, 40)}`, content: resultContent })
    });

    // インデックスを更新
    index.unshift(entry);
    const updatedIndex = Buffer.from(JSON.stringify(index, null, 2)).toString("base64");
    const indexBody = { message: `Update analysis index`, content: updatedIndex };
    if (indexSha) indexBody.sha = indexSha;
    await fetch(`https://api.github.com/repos/${REPO}/contents/analysis/index.json`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify(indexBody)
    });

    return res.status(200).json({ success: true, id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
