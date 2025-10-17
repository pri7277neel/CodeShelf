import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: "Token inválido" });
    }

    // Retorna dados básicos do usuário
    res.status(200).json({
      login: decoded.login,
      id: decoded.id,
      name: decoded.name,
      avatar_url: decoded.avatar_url
    });
  } catch (err) {
    console.error("Erro no /api/profile/get:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}
