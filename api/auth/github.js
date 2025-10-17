// /api/github.js
import { URLSearchParams } from 'url';

export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'read:user repo'
  });
  const githubUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.redirect(githubUrl);
}
