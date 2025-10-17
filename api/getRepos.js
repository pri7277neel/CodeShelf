import fetch from 'node-fetch';

export default async function handler(req, res) {
  const username = req.query.username;

  if (!username) return res.status(400).json({ error: 'Username obrigatório' });

  const token = process.env.GITHUB_PAT;

  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'CodeShelf-App',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Não foi possível carregar repositórios.' });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: 'Resposta inesperada da API.' });
    }

    const repos = data.map(repo => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
    }));

    res.status(200).json(repos);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar repositórios.' });
  }
}
