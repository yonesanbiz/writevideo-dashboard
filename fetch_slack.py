import json
import time
import os
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

SLACK_TOKEN = os.environ.get("SLACK_TOKEN", "")
client = WebClient(token=SLACK_TOKEN)

def get_all_channels():
    channels = []
    cursor = None
    while True:
        res = client.conversations_list(types="public_channel", limit=200, cursor=cursor)
        channels.extend(res["channels"])
        cursor = (res.get("response_metadata") or {}).get("next_cursor")
        if not cursor:
            break
    return channels

def get_messages(channel_id):
    messages = []
    cursor = None
    while True:
        res = client.conversations_history(channel=channel_id, limit=200, cursor=cursor)
        messages.extend(res["messages"])
        cursor = (res.get("response_metadata") or {}).get("next_cursor")
        if not cursor:
            break
        time.sleep(0.5)
    return messages

def get_thread_replies(channel_id, thread_ts):
    """スレッドの返信を全件取得"""
    replies = []
    cursor = None
    while True:
        res = client.conversations_replies(channel=channel_id, ts=thread_ts, limit=200, cursor=cursor)
        # 最初のメッセージ（親）はスキップ
        replies.extend(res["messages"][1:])
        cursor = (res.get("response_metadata") or {}).get("next_cursor")
        if not cursor:
            break
        time.sleep(0.3)
    return replies

print("チャンネル一覧取得中...")
channels = get_all_channels()
print(f"チャンネル数: {len(channels)}")

all_data = {}
for ch in channels:
    print(f"取得中: #{ch['name']}", end=" ", flush=True)
    try:
        msgs = get_messages(ch["id"])
        cleaned = []
        for m in msgs:
            if m.get("subtype") == "bot_message":
                continue
            if not m.get("text"):
                continue
            cleaned.append({
                "ts": m["ts"],
                "user": m.get("user", "unknown"),
                "text": m["text"],
                "channel": ch["name"]
            })
            # スレッド返信を取得
            if m.get("reply_count", 0) > 0:
                try:
                    replies = get_thread_replies(ch["id"], m["ts"])
                    for r in replies:
                        if r.get("subtype") == "bot_message":
                            continue
                        if not r.get("text"):
                            continue
                        cleaned.append({
                            "ts": r["ts"],
                            "user": r.get("user", "unknown"),
                            "text": r["text"],
                            "channel": ch["name"],
                            "thread_ts": m["ts"]  # 親メッセージのts
                        })
                    time.sleep(0.3)
                except SlackApiError:
                    pass

        all_data[ch["name"]] = cleaned
        print(f"→ {len(cleaned)}件")
        time.sleep(0.5)
    except SlackApiError as e:
        print(f"→ エラー: {e.response['error']}")

with open(os.path.expanduser("~/slack_data.json"), "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

total = sum(len(v) for v in all_data.values())
print(f"\n完了！合計 {total} メッセージ → ~/slack_data.json")
