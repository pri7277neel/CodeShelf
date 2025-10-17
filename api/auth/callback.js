import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Code not provided');

  // troca code por access_token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) return res.status(400).send('No access token');

  // busca dados do usuário
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const user = await userRes.json();

  // cria JWT
  const jwtToken = jwt.sign({
    login: user.login,
    id: user.id,
    avatar_url: user.avatar_url,
    name: user.name
  }, process.env.JWT_SECRET, { expiresIn: '7d' });

  // redireciona pro front com token no hash
  res.redirect(`${process.env.BASE_URL}/#token=${jwtToken}`);
}
