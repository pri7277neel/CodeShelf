// /api/saveRepo.js
import jwt from 'jsonwebtoken';

let repoData = {}; // simples storage temporário; no futuro pode usar DB

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { fullName, imageUrl } = req.body;

    if (!fullName) return res.status(400).json({ error: 'Repositório não fornecido' });

    repoData[fullName] = { owner: payload.login, imageUrl };
    res.status(200).json({ success: true });

  } catch(err) {
    res.status(500).json({ error: 'Erro interno' });
  }
}
