// api/profile/update.js
import { getSession } from '../../helpers/getSession.js';
import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Não autenticado' });

  const { owner, data } = req.body;
  if (session.login !== owner)
    return res.status(403).json({ error: 'Sem permissão para editar' });

  try {
    const client = createClient();
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        owner TEXT PRIMARY KEY,
        data JSONB
      )
    `);

    await client.query(
      `INSERT INTO profiles (owner, data)
       VALUES ($1, $2)
       ON CONFLICT (owner)
       DO UPDATE SET data = EXCLUDED.data;`,
      [owner, data]
    );

    await client.end();
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
