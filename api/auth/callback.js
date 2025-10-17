import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;
    if (!access_token) return res.status(401).send('GitHub token inválido');

    // pegar info do usuário
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userRes.json();

    const jwtToken = jwt.sign(
      { githubToken: access_token, login: userData.login, name: userData.name, avatar_url: userData.avatar_url },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // redireciona com token
    res.redirect(`${process.env.BASE_URL}/#token=${jwtToken}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no callback do GitHub');
  }
}
