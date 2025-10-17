// /api/getRepos.js
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch(err) { return res.status(401).json({ error: 'Token inválido ou expirado' }); }

    const username = req.query.username;
    if (!username) return res.status(400).json({ error: 'Username é obrigatório' });

    const githubRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { Authorization: `token ${payload.access_token}`, Accept: 'application/vnd.github.v3+json' }
    });

    if (!githubRes.ok) {
      const errData = await githubRes.json();
      return res.status(githubRes.status).json({ error: errData.message || 'Erro ao acessar GitHub' });
    }

    const repos = await githubRes.json();
    return res.status(200).json(repos);

  } catch(err) {
    console.error('Erro em getRepos:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
