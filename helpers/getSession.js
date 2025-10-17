import jwt from 'jsonwebtoken';

export function getSession(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '') || req.query.token || null;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload; // Ex: { githubToken, login, name, avatar_url }
  } catch (err) {
    console.error('Token inválido', err);
    return null;
  }
}
