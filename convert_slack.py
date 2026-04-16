"""
fetch_slack.pyで取得したslack_data.jsonを
slack_data_clean.jsonに変換するスクリプト

使い方:
1. fetch_slack.pyをローカルで実行 → ~/slack_data.json生成
2. このスクリプトをローカルで実行:
   python3 convert_slack.py ~/slack_data.json slack_data_clean.json
3. 生成されたslack_data_clean.jsonをリポジトリにコピーしてpush
"""
import json, sys, os

input_file = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/slack_data.json")
output_file = sys.argv[2] if len(sys.argv) > 2 else "slack_data_clean.json"

data = json.loads(open(input_file, encoding="utf-8").read())

# {channel: [messages]} → フラット配列に変換
result = []
for ch_name, messages in data.items():
    for m in messages:
        entry = {
            "ch": ch_name,
            "ts": m.get("ts", ""),
            "user": m.get("user", "不明"),
            "text": m.get("text", "")
        }
        if "thread_ts" in m:
            entry["thread_ts"] = m["thread_ts"]
        result.append(entry)

# tsでソート
result.sort(key=lambda x: float(x["ts"]) if x["ts"] else 0, reverse=True)

json.dump(result, open(output_file, "w", encoding="utf-8"), ensure_ascii=False)
print(f"✓ {len(result)}件 → {output_file}")
print(f"サンプル: {json.dumps(result[0], ensure_ascii=False)}")
