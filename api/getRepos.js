// api/getRepos.js
import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  const { owner } = req.query;
  if (!owner) return res.status(400).json({ error: 'owner obrigatório' });

  const client = createClient();
  await client.connect();

  const { rows } = await client.query(
    `SELECT repo, image FROM repo_images WHERE owner = $1`,
    [owner]
  );

  await client.end();
  res.json(rows);
}
