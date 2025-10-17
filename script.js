// Selecionando elementos
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileContainer = document.getElementById('profile');
const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const searchContainer = document.getElementById('search-container');
const usernameInput = document.getElementById('username');
const searchBtn = document.getElementById('search-btn');
const reposContainer = document.getElementById('repos');
const errorEl = document.getElementById('error');

// Token JWT armazenado localmente
let token = localStorage.getItem('jwt');

// Função para atualizar UI após login
function updateUILoggedIn(user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    profileContainer.style.display = 'block';
    searchContainer.style.display = 'flex';
    avatar.src = user.avatar_url;
    nameEl.textContent = user.name;
    bioEl.textContent = user.bio || '';
}

// Função para atualizar UI após logout
function updateUILoggedOut() {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    profileContainer.style.display = 'none';
    searchContainer.style.display = 'none';
    reposContainer.style.display = 'none';
    errorEl.style.display = 'none';
}

// Função para obter perfil via API
async function getProfile() {
    try {
        const res = await fetch('/api/profile/get', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Falha ao carregar perfil.');
        const data = await res.json();
        updateUILoggedIn(data);
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        updateUILoggedOut();
    }
}

// Função para buscar repositórios
async function buscarRepos() {
    const username = usernameInput.value.trim();
    if (!username) return;

    reposContainer.innerHTML = '';
    errorEl.style.display = 'none';

    try {
        const res = await fetch(`/api/getRepos?username=${username}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Token inválido ou erro ao buscar repositórios.');
        const repos = await res.json();
        if (!Array.isArray(repos)) throw new Error('Resposta inesperada da API.');

        reposContainer.style.display = 'flex';
        repos.forEach(repo => {
            const card = document.createElement('div');
            card.classList.add('repo-card');
            card.innerHTML = `<h3>${repo.name}</h3><p>${repo.description || 'Sem descrição'}</p>`;
            reposContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        errorEl.textContent = 'Erro ao carregar repositórios.';
        errorEl.style.display = 'block';
    }
}

// Eventos
loginBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/github';
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    token = null;
    updateUILoggedOut();
});

searchBtn.addEventListener('click', buscarRepos);

// Inicialização
if (token) {
    getProfile();
} else {
    updateUILoggedOut();
}
