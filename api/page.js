import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { p } = req.query;
  
  const allowed = [
    'writevideo_final_evaluation',
    'yonekura_analysis', 
    'writevideo_customer_analysis',
    'shodan_analysis',
    'exhibition_analysis',
    'writevideo_revaluation',
    'writevideo_sales_analysis',
    'channel_list',
    'salary_dashboard',
    'salary_bonus'
  ];

  if (!allowed.includes(p)) {
    return res.status(404).send('Not found');
  }

  // セッション確認
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/wv_session=([^;]+)/);
  
  if (!match) {
    return res.redirect('/index.html');
  }

  try {
    const data = JSON.parse(Buffer.from(match[1], 'base64').toString());
    if (!data.auth) {
      return res.redirect('/index.html');
    }
  } catch {
    return res.redirect('/index.html');
  }

  // 認証OK - ファイルを読んで返す
  // Vercelではprocess.cwd()ではなくimport.meta.urlベースのパスを使う
  const filePath = path.join(process.cwd(), `${p}.html`);
  const altPath = path.resolve(`${p}.html`);
  
  let content = null;
  for (const fp of [filePath, altPath, `/var/task/${p}.html`]) {
    try {
      content = fs.readFileSync(fp, 'utf-8');
      break;
    } catch {}
  }

  if (!content) {
    return res.status(404).send(`File not found: ${p}.html`);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(content);
}
