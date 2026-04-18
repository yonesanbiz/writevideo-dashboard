import { checkAuth } from './auth-check.js';

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, context, channel } = req.body;
  if (!prompt || !context) return res.status(400).json({ error: "prompt and context required" });

  const API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!API_KEY) return res.status(500).json({ error: "API key not set" });

  // SSEでストリーミング
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        thinking: { type: "enabled", budget_tokens: 10000 },
        stream: true,
        messages: [{
          role: "user",
          content: `以下はWriteVideo.aiの社内Slackチャンネル「#${channel}」の会話ログです。\n\n<slack_log>\n${context}\n</slack_log>\n\n指示: ${prompt}\n\n日本語で回答してください。`,
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      send({ type: "error", message: err.error?.message || "API error" });
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === "content_block_start") {
            if (evt.content_block?.type === "thinking") {
              send({ type: "thinking_start" });
            } else if (evt.content_block?.type === "text") {
              send({ type: "text_start" });
            }
          } else if (evt.type === "content_block_delta") {
            if (evt.delta?.type === "thinking_delta") {
              send({ type: "thinking", text: evt.delta.thinking });
            } else if (evt.delta?.type === "text_delta") {
              send({ type: "text", text: evt.delta.text });
            }
          } else if (evt.type === "content_block_stop") {
            send({ type: "block_end" });
          } else if (evt.type === "message_stop") {
            send({ type: "done" });
          }
        } catch {}
      }
    }
  } catch (e) {
    send({ type: "error", message: e.message });
  }
  res.end();
}
