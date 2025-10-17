// api/auth/callback.js
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    // Troca o código pelo token de acesso do GitHub
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const { access_token } = await tokenRes.json();
    if (!access_token) return res.status(400).send("Token inválido");

    // Pega os dados do usuário autenticado
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${access_token}` },
    });
    const user = await userRes.json();

    // Gera token JWT seguro
    const token = jwt.sign(
      {
        login: user.login,
        id: user.id,
        avatar: user.avatar_url,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Define cookie HttpOnly com o token
    res.setHeader(
      "Set-Cookie",
      `cs_session=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${
        60 * 60 * 2
      }`
    );

    res.writeHead(302, { Location: "/" }); // volta pro site
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao autenticar");
  }
}
