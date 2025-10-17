// api/auth/github.js
export default function handler(req, res) {
  try {
    const client_id = process.env.GITHUB_CLIENT_ID;
    const baseUrl = process.env.BASE_URL;

    if (!client_id || !baseUrl) {
      return res.status(500).json({ error: 'Client ID ou BASE_URL não configurado' });
    }

    const redirect_uri = `${baseUrl}/api/auth/callback`;
    const scope = 'read:user';

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
      redirect_uri
    )}&scope=${encodeURIComponent(scope)}`;

    // redireciona pro GitHub
    res.writeHead(302, { Location: githubAuthUrl });
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
