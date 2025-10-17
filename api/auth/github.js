// /api/auth/github.js
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/api/auth/callback`;
  const scope = 'read:user';

  if (!clientId) {
    return res.status(500).json({ error: 'GITHUB_CLIENT_ID não definido' });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.writeHead(302, { Location: githubAuthUrl });
  res.end();
}
