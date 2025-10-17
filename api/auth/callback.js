// api/auth/callback.js
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Código não fornecido' });

    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;
    const jwt_secret = process.env.JWT_SECRET;
    const baseUrl = process.env.BASE_URL;

    if (!client_id || !client_secret || !jwt_secret || !baseUrl) {
      return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
    }

    // Troca o code pelo access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(400).json({ error: 'Não foi possível obter access token' });

    const accessToken = tokenData.access_token;

    // Pega info do usuário
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json();

    // Gera JWT
    const token = jwt.sign(
      {
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        name: user.name,
      },
      jwt_secret,
      { expiresIn: '7d' }
    );

    // Redireciona para frontend com token no hash
    res.writeHead(302, {
      Location: `${baseUrl}/#token=${token}`,
    });
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
