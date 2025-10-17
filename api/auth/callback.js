// /api/callback.js
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Código OAuth não fornecido');

  try {
    // troca code pelo access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Não foi possível obter token');

    // pega dados do usuário
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    // cria JWT
    const jwtToken = jwt.sign({
      login: user.login,
      id: user.id,
      avatar_url: user.avatar_url,
      access_token: tokenData.access_token
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // redireciona pro front com token no hash
    const redirectUrl = `${process.env.BASE_URL}/#token=${jwtToken}`;
    res.redirect(redirectUrl);

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no callback OAuth');
  }
}
