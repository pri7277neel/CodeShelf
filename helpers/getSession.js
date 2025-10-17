// /api/getSession.js
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json(payload);

  } catch(err) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
