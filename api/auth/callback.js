// 5. /api/auth/callback.js
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { URLSearchParams } from 'url';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: params,
    headers: { 'Accept': 'application/json' },
  });
  const { access_token } = await tokenRes.json();

  if (!access_token) {
    return res.status(400).json({ error: 'No access token' });
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  const user = await userRes.json();

  const token = jwt.sign(
    { user: { login: user.login, name: user.name, avatar_url: user.avatar_url }, access_token },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.redirect(302, `${baseUrl}/#token=${token}`);
}