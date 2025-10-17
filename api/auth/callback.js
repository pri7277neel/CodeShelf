// /api/auth/callback.js
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Código OAuth não fornecido.');

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (!clientId || !clientSecret || !jwtSecret || !baseUrl) {
    return res.status(500).send('Variáveis de ambiente não configuradas.');
  }

  try {
    // Troca o code pelo access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error('Token inválido do GitHub');

    // Pega info do usuário
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const user = await userRes.json();

    // Cria JWT
    const token = jwt.sign({
      login: user.login,
      id: user.id,
      avatar_url: user.avatar_url,
      name: user.name || user.login
    }, jwtSecret, { expiresIn: '7d' });

    // Redireciona para o front com token
    res.writeHead(302, { Location: `${baseUrl}/#token=${token}` });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no callback OAuth.');
  }
}
