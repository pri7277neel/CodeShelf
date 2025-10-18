// 6. /api/profile/get.js
import { getSession } from '../../helpers/getSession.js';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(session.user);
}