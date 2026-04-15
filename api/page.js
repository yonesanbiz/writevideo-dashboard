export default async function handler(req, res) {
  const { p } = req.query;
  
  // 許可するページ
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
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), `${p}.html`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(content);
  } catch {
    res.status(404).send('Not found');
  }
}
