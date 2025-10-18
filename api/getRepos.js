// 7. /api/getRepos.js
import fetch from 'node-fetch';
import { getSession } from '../../helpers/getSession.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { access_token } = session;

  const reposRes = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!reposRes.ok) {
    return res.status(reposRes.status).json({ error: 'Failed to fetch repos' });
  }

  const repos = await reposRes.json();
  res.json(repos);
}