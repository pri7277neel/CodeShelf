// ---------------------------
// Variáveis globais
// ---------------------------
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileContainer = document.getElementById('profile');
const reposContainer = document.getElementById('repos');
const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username');

// ---------------------------
// Função de login
// ---------------------------
loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

// ---------------------------
// Função de logout
// ---------------------------
logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Não foi possível deslogar');
    window.location.reload();
  } catch (err) {
    console.error('Erro ao deslogar:', err);
  }
});

// ---------------------------
// Função para carregar perfil
// ---------------------------
async function carregarPerfil() {
  try {
    const res = await fetch('/api/profile/get');
    if (!res.ok) throw new Error('Erro ao carregar perfil');
    const profile = await res.json();

    if (!profile || !profile.login) {
      profileContainer.innerHTML = '<p>Nenhum perfil encontrado</p>';
      return;
    }

    profileContainer.innerHTML = `
      <img src="${profile.avatar_url}" alt="Avatar do usuário">
      <h2>${profile.name || profile.login}</h2>
      <p>${profile.bio || ''}</p>
    `;
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    profileContainer.innerHTML = `<p>Erro ao carregar perfil: ${err.message}</p>`;
  }
}

// ---------------------------
// Função para buscar repositórios
// ---------------------------
async function buscarRepos(username) {
  reposContainer.innerHTML = '';
  if (!username) return;

  try {
    const res = await fetch(`/api/getRepos?username=${username}`);
    if (!res.ok) throw new Error('Não foi possível carregar repositórios.');

    const repos = await res.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      reposContainer.innerHTML = '<p>Nenhum repositório encontrado ou token inválido.</p>';
      return;
    }

    repos.forEach(repo => {
      const card = document.createElement('div');
      card.classList.add('repo-card');
      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || 'Sem descrição'}</p>
        <a href="${repo.html_url}" target="_blank">Ver no GitHub</a>
      `;
      reposContainer.appendChild(card);
    });

  } catch (err) {
    console.error('Erro ao carregar repositórios:', err);
    reposContainer.innerHTML = `<p>Erro ao carregar repositórios: ${err.message}</p>`;
  }
}

// ---------------------------
// Evento do botão de busca
// ---------------------------
searchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  buscarRepos(username);
});

// ---------------------------
// Inicialização
// ---------------------------
window.addEventListener('DOMContentLoaded', () => {
  carregarPerfil();

  // Se houver token no hash da URL, limpa para não confundir
  if (window.location.hash.includes('#token=')) {
    window.history.replaceState(null, null, window.location.pathname);
  }
});
