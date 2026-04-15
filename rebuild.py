#!/usr/bin/env python3
"""
使い方: python3 rebuild.py
実行するとapi/page.jsを最新HTMLで再生成し、Gitにプッシュする
・全ページのReleasedを現在時刻に更新
・HTMLにReleasedがない場合は<div class="sub">の後か<body>直後に自動挿入
"""
import os, json, re, subprocess
from datetime import datetime, timezone, timedelta

now_utc = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
jst = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime('%Y-%m-%d %H:%M JST')

RELEASED_TAG = f'<div style="font-size:10px;font-family:monospace;color:#bbb;margin-bottom:12px;">Released: {jst}</div>'

files = [
    'writevideo_final_evaluation','yonekura_analysis','writevideo_customer_analysis',
    'shodan_analysis','exhibition_analysis','writevideo_revaluation',
    'writevideo_sales_analysis','channel_list','salary_dashboard','salary_bonus',
    'person_dashboard'
]

pages = {}
for f in files:
    path = f'{f}.html'
    if not os.path.exists(path): continue
    content = open(path, encoding='utf-8').read()

    # 既存のReleased日時を更新
    if re.search(r'Released: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST', content):
        content = re.sub(
            r'Released: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST',
            f'Released: {jst}',
            content
        )
    # なければ挿入（<div class="sub">の後 or <body>直後）
    elif '<div class="sub">' in content:
        # subの閉じタグの直後に挿入
        content = re.sub(
            r'(<div class="sub">.*?</div>)',
            r'\1' + '\n' + RELEASED_TAG,
            content, count=1, flags=re.DOTALL
        )
    else:
        content = content.replace('<body>', '<body>\n' + RELEASED_TAG, 1)

    open(path, 'w', encoding='utf-8').write(content)
    pages[f] = content
    print(f'  ✓ {f}: Released更新')

js = f'''export default async function handler(req, res) {{
  const {{ p }} = req.query;
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.redirect("/index.html");
  try {{
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.redirect("/index.html");
  }} catch {{ return res.redirect("/index.html"); }}
  const pages = {json.dumps(pages, ensure_ascii=False)};
  if (!pages[p]) return res.status(404).send("Not found");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).send(pages[p]);
}}
'''
open('api/page.js', 'w', encoding='utf-8').write(js)
print(f'✓ api/page.js再生成完了: {jst}')

token = os.environ.get('GITHUB_TOKEN', '')
if not token:
    print('⚠ GITHUB_TOKEN未設定。git push をスキップ')
else:
    subprocess.run(['git', 'add', '-A'])
    subprocess.run(['git', 'commit', '-m', f'Rebuild: {jst}'])
    subprocess.run(['git', 'push', f'https://yonesanbiz:{token}@github.com/yonesanbiz/writevideo-dashboard.git', 'main'])
    print('✓ プッシュ完了')
