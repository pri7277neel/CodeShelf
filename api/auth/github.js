import { URLSearchParams } from 'url';

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${baseUrl}/api/auth/callback`,
  });
  res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
}
