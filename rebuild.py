#!/usr/bin/env python3
"""
使い方: python3 rebuild.py
実行するとapi/page.jsを最新HTMLで再生成し、Gitにプッシュする
"""
import os, json, re, subprocess
from datetime import datetime, timezone, timedelta

now_utc = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
jst = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime('%Y-%m-%d %H:%M JST')

files = [
    'writevideo_final_evaluation','yonekura_analysis','writevideo_customer_analysis',
    'shodan_analysis','exhibition_analysis','writevideo_revaluation',
    'writevideo_sales_analysis','channel_list','salary_dashboard','salary_bonus'
]

pages = {}
for f in files:
    path = f'{f}.html'
    if not os.path.exists(path): continue
    content = open(path, encoding='utf-8').read()
    content = re.sub(
        r'Released: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST',
        f'Released: {jst}',
        content
    )
    open(path, 'w', encoding='utf-8').write(content)
    pages[f] = content

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

# トークンは環境変数 GITHUB_TOKEN から読む
token = os.environ.get('GITHUB_TOKEN', '')
if not token:
    print('⚠ GITHUB_TOKEN未設定。git push をスキップ')
else:
    subprocess.run(['git', 'add', '-A'])
    subprocess.run(['git', 'commit', '-m', f'Rebuild: {jst}'])
    subprocess.run(['git', 'push', f'https://yonesanbiz:{token}@github.com/yonesanbiz/writevideo-dashboard.git', 'main'])
    print('✓ プッシュ完了')
