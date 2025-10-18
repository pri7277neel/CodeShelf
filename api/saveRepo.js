// 8. /api/saveRepo.js
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '../../helpers/getSession.js';

const upload = multer({ dest: '/tmp/' }); // Use /tmp para Vercel

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const { repo } = req.body; // full_name
    const file = req.file;
    if (!file || !repo) {
      return res.status(400).json({ error: 'Missing file or repo' });
    }

    try {
      const buffer = await fs.readFile(file.path);
      const content = buffer.toString('base64');
      const { access_token } = session;
      const [owner, repoName] = repo.split('/');

      // Verificar se arquivo existe para obter SHA
      let sha = null;
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/codeshelf-custom-image.jpg`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      if (getRes.ok) {
        const { sha: existingSha } = await getRes.json();
        sha = existingSha;
      }

      // Upload ou update
      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/codeshelf-custom-image.jpg`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          message: 'Add/update custom image for CodeShelf',
          content,
          sha,
        }),
      });

      if (!putRes.ok) {
        throw new Error('Failed to save to GitHub');
      }

      await fs.unlink(file.path); // Limpar tmp
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export const config = {
  api: {
    bodyParser: false, // Desabilitar bodyParser padrão para multer
  },
};