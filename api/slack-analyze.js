export default async function handler(req, res) {
  // 認証チェック
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Unauthorized" });
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.status(401).json({ error: "Unauthorized" });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, context, channel } = req.body;
  if (!prompt || !context) return res.status(400).json({ error: "prompt and context required" });

  const API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!API_KEY) return res.status(500).json({ error: "API key not set" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `以下はWriteVideo.aiの社内Slackチャンネル「#${channel}」の会話ログです。

<slack_log>
${context}
</slack_log>

指示: ${prompt}

日本語で回答してください。`,
          },
        ],
      }),
    });

    const data2 = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data2.error?.message || "API error" });
    }

    const result = data2.content?.[0]?.text || "回答を生成できませんでした";
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
