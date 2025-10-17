// api/saveRepo.js
import { createClient } from '@vercel/postgres';
import { getSession } from '../helpers/getSession.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Não autenticado' });

  const { repo, image } = req.body;
  if (!repo || !image) return res.status(400).json({ error: 'Dados inválidos' });

  const client = createClient();
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS repo_images (
      owner TEXT,
      repo TEXT,
      image TEXT,
      PRIMARY KEY (owner, repo)
    )
  `);

  await client.query(
    `INSERT INTO repo_images (owner, repo, image)
     VALUES ($1, $2, $3)
     ON CONFLICT (owner, repo)
     DO UPDATE SET image = EXCLUDED.image;`,
    [session.login, repo, image]
  );

  await client.end();
  res.json({ ok: true });
}
