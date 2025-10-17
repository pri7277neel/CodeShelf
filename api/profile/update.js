// /api/update.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { fullName, favorites } = req.body;

    // Aqui você pode atualizar favoritos no storage (ex: banco ou JSON)
    // Exemplo simples: apenas logar
    console.log(`Usuário ${payload.login} atualizou favoritos do repo ${fullName}`, favorites);

    res.status(200).json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Erro interno' });
  }
}
