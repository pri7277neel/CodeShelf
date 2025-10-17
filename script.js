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

// Função para extrair token do hash da URL
function getTokenFromHash() {
    if (window.location.hash.startsWith('#token=')) {
        const t = window.location.hash.split('=')[1];
        // Limpa o hash da URL
        window.history.replaceState(null, null, window.location.pathname);
        return t;
    }
    return null;
}

// Armazena o token no localStorage
let token = getTokenFromHash() || localStorage.getItem('jwt');
if (getTokenFromHash()) localStorage.setItem('jwt', token);

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
    localStorage.removeItem('jwt');
}

// Função para obter perfil via API
async function getProfile() {
    if (!token) return updateUILoggedOut();

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
        const data = await res.json();

        // Garante que repos seja sempre array
        const repos = Array.isArray(data) ? data : [];

        if (repos.length === 0) {
            errorEl.textContent = 'Nenhum repositório encontrado.';
            errorEl.style.display = 'block';
            return;
        }

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
    updateUILoggedOut();
});

searchBtn.addEventListener('click', buscarRepos);

// Inicialização
if (token) {
    getProfile();
} else {
    updateUILoggedOut();
}

