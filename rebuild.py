#!/usr/bin/env python3
"""
使い方: GITHUB_TOKEN=xxxx python3 rebuild.py
・api/salary-data.jsのデータをsalary_dashboard/person_dashboard/salary_bonusに同期
・全ページのReleased日時を現在時刻に更新
・api/page.jsを再生成してGitHubにプッシュ
"""
import os, json, re, subprocess
from datetime import datetime, timezone, timedelta

now_utc = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
jst = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime('%Y-%m-%d %H:%M JST')

RELEASED_TAG_TEMPLATE = 'Released: {jst}'

# ===== 優先度2: salary-data.jsからデータを読み込んで各HTMLに同期 =====
def sync_salary_data():
    # extract_salary.js経由でデータを取得
    result = subprocess.run(['node', 'extract_salary.js'], capture_output=True, text=True)
    if not result.stdout:
        print('⚠ salary-data.js読み込み失敗:', result.stderr[:100])
        return None
    data = json.loads(result.stdout)
    print(f'✓ salary-data.js読み込み: R={len(data["R"])}名, L={len(data["L"])}ヶ月')

    # 各HTMLのデータブロックを salary-data.js の内容で上書き
    data_block = build_data_block(data)

    for fname in ['salary_dashboard.html', 'person_dashboard.html', 'salary_bonus.html']:
        if not os.path.exists(fname):
            continue
        html = open(fname, encoding='utf-8').read()
        new_html = replace_data_block(html, data_block, fname)
        if new_html != html:
            open(fname, 'w', encoding='utf-8').write(new_html)
            print(f'  ✓ {fname}: 給与データ同期')
        else:
            print(f'  - {fname}: 変更なし')
    return data

def build_data_block(d):
    """salary-data.jsのデータからHTMLに埋め込むJSブロックを生成"""
    lines = []
    lines.append(f'const L={json.dumps(d["L"], ensure_ascii=False)};')
    lines.append(f'const CUTOFF={d["CUTOFF"]};')
    lines.append(f'const OUTSOURCE_START={d["OUTSOURCE_START"]}; // 25/01')
    lines.append('')
    lines.append('// 海外エンジニア費用（日本円・万円）24/06〜26/10')
    lines.append(f'const OVERSEAS_START={d["OVERSEAS_START"]}; // 24/06')
    lines.append(f'const OVERSEAS_DATA={json.dumps(d["OVERSEAS_DATA"])};')
    lines.append('const overseasTotal=L.map((_,i)=>{')
    lines.append('  const idx=i-OVERSEAS_START;')
    lines.append('  return (idx>=0&&idx<OVERSEAS_DATA.length)?OVERSEAS_DATA[idx]:0;')
    lines.append('});')
    lines.append('')
    lines.append('// 部門分類')
    lines.append(f'const SALES={json.dumps(d["SALES"], ensure_ascii=False)};')
    lines.append(f'const DEV={json.dumps(d["DEV"], ensure_ascii=False)};')
    lines.append('')
    lines.append(f'const C={json.dumps(d["C"], ensure_ascii=False)};')
    bi = d.get("BI", {})
    lines.append(f'const BI={json.dumps(bi, ensure_ascii=False)};')
    lines.append('')
    # BONUS_SPLIT
    bs_lines = ['const BONUS_SPLIT={']
    for name, val in d['BONUS_SPLIT'].items():
        bs_lines.append(f'  {json.dumps(name, ensure_ascii=False)}:{json.dumps(val)},')
    bs_lines.append('};')
    lines.extend(bs_lines)
    # R配列
    r_lines = ['const R={']
    for name, arr in d['R'].items():
        r_lines.append(f'  {json.dumps(name, ensure_ascii=False)}:  {json.dumps(arr)},')
    r_lines.append('};')
    lines.extend(r_lines)
    # ユーティリティ関数
    lines.append("""
function getNormalData(name,arr){
  const bs=BONUS_SPLIT[name]||{};
  return arr.map((v,i)=>{
    if(v===null)return null;
    if(bs[String(i)]!==undefined)return bs[String(i)][0];
    return v;
  });
}
function getBonusData(name,arr){
  const bs=BONUS_SPLIT[name]||{};
  return arr.map((v,i)=>{
    if(v===null)return null;
    if(bs[String(i)]!==undefined)return bs[String(i)][1];
    return null;
  });
}""")
    return '\n'.join(lines)

def replace_data_block(html, new_block, fname):
    """HTMLのデータ定義ブロック（L=からデータ定義終端まで）を置き換え"""
    start_marker = 'const L=["21/02"'
    # ファイルごとに終端マーカーが異なる
    end_markers = [
        '\n// 月次合計（部門別）',   # salary_dashboard
        '\nconst NAMES',              # person_dashboard
        '\n// ボーナスデータ',         # salary_bonus
    ]

    start = html.find(start_marker)
    if start == -1:
        return html

    end = -1
    for marker in end_markers:
        pos = html.find(marker, start)
        if pos > 0:
            end = pos
            break

    if end == -1:
        return html

    old_block = html[start:end]
    return html[:start] + new_block + '\n' + html[end:]

# ===== メイン処理 =====
print('=== salary-data.js同期 ===')
sync_salary_data()

files = [
    'writevideo_final_evaluation','yonekura_analysis','writevideo_customer_analysis',
    'shodan_analysis','exhibition_analysis','writevideo_revaluation',
    'writevideo_sales_analysis','channel_list','salary_dashboard','salary_bonus',
    'person_dashboard','analysis_list','analysis_detail','slack_channel','slack_search','slack_analyze','writevideo_5year_plan','interview_yamamoto'
]

RELEASED_TAG = f'<div style="font-size:10px;font-family:monospace;color:#bbb;margin-bottom:12px;">Released: {jst}</div>'

print('\n=== Released日時更新 ===')
pages = {}
for f in files:
    path = f'{f}.html'
    if not os.path.exists(path):
        continue
    content = open(path, encoding='utf-8').read()

    if re.search(r'Released: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST', content):
        content = re.sub(
            r'Released: \d{4}-\d{2}-\d{2} \d{2}:\d{2} JST',
            f'Released: {jst}',
            content
        )
    elif '<div class="sub">' in content:
        content = re.sub(
            r'(<div class="sub">.*?</div>)',
            r'\1' + '\n' + RELEASED_TAG,
            content, count=1, flags=re.DOTALL
        )
    else:
        content = content.replace('<body>', '<body>\n' + RELEASED_TAG, 1)

    open(path, 'w', encoding='utf-8').write(content)
    pages[f] = content
    print(f'  ✓ {f}')

print('\n=== api/page.js再生成 ===')
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

# ===== 優先度3: 不要ファイルの削除 =====
print('\n=== 不要ファイルの削除 ===')
stale = ['salary2.html', 'salary_v2.html', 'salary_bonus_v2.html',
         'api/salary_dashboard.js', 'api/salary_bonus.js']
for f in stale:
    if os.path.exists(f):
        os.remove(f)
        print(f'  ✓ 削除: {f}')
    else:
        print(f'  - {f}: 既になし')

# ===== 優先度4: 認証の共通化 =====
# api/auth-check.jsを作成
AUTH_HELPER = '''// 共通認証チェック関数
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
'''
open('api/auth-check.js', 'w').write(AUTH_HELPER)
print('\n=== 認証共通化 ===')
print('✓ api/auth-check.js作成')

# 各APIファイルの認証コードをcheckAuth使用に変更
OLD_AUTH_BLOCK = '''  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "Unauthorized" });
  try {
    const data = JSON.parse(Buffer.from(match[1], "base64").toString());
    if (!data.auth) return res.status(401).json({ error: "Unauthorized" });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }'''

NEW_AUTH_BLOCK = '  if (!checkAuth(req, res)) return;'

api_files = ['api/slack-analyze.js','api/slack-channel.js','api/slack-search.js',
             'api/save-analysis.js','api/get-analysis.js',
             'api/salary-data.js','api/send-code.js','api/verify-code.js','api/logout.js']

for f in api_files:
    if not os.path.exists(f): continue
    content = open(f).read()
    if OLD_AUTH_BLOCK in content:
        # importを先頭に追加
        new_content = "import { checkAuth } from './auth-check.js';\n" + content.replace(OLD_AUTH_BLOCK, NEW_AUTH_BLOCK)
        open(f, 'w').write(new_content)
        print(f'  ✓ {f}: 認証共通化')
    else:
        print(f'  - {f}: パターン不一致（スキップ）')

# ===== プッシュ =====
token = os.environ.get('GITHUB_TOKEN', '')
if not token:
    print('\n⚠ GITHUB_TOKEN未設定。git push をスキップ')
else:
    subprocess.run(['git', 'add', '-A'])
    subprocess.run(['git', 'commit', '-m', f'Refactor: sync salary-data, remove stale files, unify auth - {jst}'])
    subprocess.run(['git', 'push', f'https://yonesanbiz:{token}@github.com/yonesanbiz/writevideo-dashboard.git', 'main'])
    print('\n✓ プッシュ完了')
