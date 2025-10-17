import { getSession } from '../helpers/getSession.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Token inválido ou ausente' });

  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username não fornecido' });

  try {
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
      headers: { Authorization: `Bearer ${session.githubToken}` },
    });
    const repos = await reposRes.json();
    res.status(200).json(repos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível carregar repositórios' });
  }
}
