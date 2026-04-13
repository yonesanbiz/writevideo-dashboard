export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/wv_session=([^;]+)/);

  if (!match) return res.status(401).json({ auth: false });

  try {
    const data = JSON.parse(Buffer.from(match[1], 'base64').toString());
    if (data.auth) {
      return res.status(200).json({ auth: true, email: data.email });
    }
  } catch (e) {}

  res.status(401).json({ auth: false });
}
