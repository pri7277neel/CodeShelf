import jwt from "jsonwebtoken";
import fetch from "node-fetch";

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Código de autenticação não fornecido" });
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const data = await response.json();

    if (!data.access_token) {
      return res.status(400).json({ error: "Falha ao obter access_token" });
    }

    // Busca dados do usuário no GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${data.access_token}` }
    });
    const user = await userRes.json();

    // Cria token JWT
    const token = jwt.sign(
      {
        login: user.login,
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redireciona com token
    const base = process.env.BASE_URL || "http://localhost:3000";
    return res.redirect(`${base}/#token=${token}`);
  } catch (error) {
    console.error("Erro no callback:", error);
    return res.status(500).json({ error: "Erro interno na autenticação" });
  }
}
