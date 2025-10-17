import fetch from 'node-fetch';
import { getSession } from '../../helpers/getSession';

export default async function handler(req, res) {
    const { username } = req.query;
    const session = await getSession(req);

    if (!session || !session.token) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos`, {
            headers: {
                Authorization: `token ${session.token}`,
                'User-Agent': 'CodeShelf-App'
            }
        });

        if (!response.ok) {
            const msg = await response.text();
            return res.status(response.status).json({ error: msg });
        }

        const repos = await response.json();
        res.status(200).json(Array.isArray(repos) ? repos : []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar repositórios' });
    }
}
