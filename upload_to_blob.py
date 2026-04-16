"""
Vercel BlobにSlackデータをアップロードするスクリプト
ローカルで実行: python3 upload_to_blob.py
"""
import json, os, urllib.request, urllib.parse

BLOB_TOKEN = "vercel_blob_rw_Gb3Xnd1yThQWM0KH_l6oW4ptB5NdqdhXHnd9aHpCH9g2oMP"

def upload(path, data, content_type="application/json"):
    url = f"https://blob.vercel-storage.com/{path}"
    req = urllib.request.Request(
        url,
        data=data.encode('utf-8') if isinstance(data, str) else data,
        headers={
            "Authorization": f"Bearer {BLOB_TOKEN}",
            "Content-Type": content_type,
            "x-api-version": "7",
        },
        method="PUT"
    )
    try:
        with urllib.request.urlopen(req) as res:
            result = json.loads(res.read())
            return result.get("url", "")
    except Exception as e:
        print(f"  エラー: {e}")
        return None

# _indexをアップロード
print("インデックスをアップロード中...")
index_data = open("slack_channels/_index.json", encoding="utf-8").read()
url = upload("slack/_index.json", index_data)
print(f"  ✓ index: {url}")

# 各チャンネルをアップロード
files = [f for f in os.listdir("slack_channels") if f.endswith(".json") and f != "_index.json"]
print(f"\n{len(files)}チャンネルをアップロード中...")

for i, fname in enumerate(sorted(files), 1):
    data = open(f"slack_channels/{fname}", encoding="utf-8").read()
    url = upload(f"slack/{fname}", data)
    if url:
        print(f"  [{i}/{len(files)}] ✓ {fname}")
    else:
        print(f"  [{i}/{len(files)}] ✗ {fname} 失敗")

print("\n完了!")
