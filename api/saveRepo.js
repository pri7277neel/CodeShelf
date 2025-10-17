import { getSession } from '../helpers/getSession.js';

let repoImages = {}; // ainda em memória, pode migrar pra DB se quiser

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Token inválido ou ausente' });

  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { fullName, image } = req.body;
  if (!fullName || !image) return res.status(400).json({ error: 'Dados incompletos' });

  // salva em memória (substituir depois por DB)
  repoImages[fullName] = image;
  res.status(200).json({ success: true, repoImages });
}
