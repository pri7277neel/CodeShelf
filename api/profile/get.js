// api/profile/get.js
import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  const { owner } = req.query;
  if (!owner) return res.status(400).json({ error: 'owner obrigatório' });

  try {
    const client = createClient();
    await client.connect();

    const { rows } = await client.query(
      `SELECT data FROM profiles WHERE owner = $1`,
      [owner]
    );

    await client.end();
    if (rows.length === 0) return res.status(404).json({ error: 'Perfil não encontrado' });
    res.json(rows[0].data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
