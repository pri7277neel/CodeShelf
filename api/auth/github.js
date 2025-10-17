// api/auth/github.js

export default async function handler(req, res) {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user`;
  res.writeHead(302, { Location: redirect });
  res.end();
}
