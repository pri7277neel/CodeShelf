// Variáveis globais
let token = null;
let user = null;

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginBtn = document.getElementById('login-github');
const logoutBtn = document.getElementById('logout');
const userInfoDiv = document.getElementById('user-info');
const reposContainer = document.getElementById('repos-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

// ----------------------
// Funções de sessão
// ----------------------
function getTokenFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    token = hash.replace('#token=', '');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function getSession() {
  if (!token) getTokenFromHash();
  if (!token) return;

  // Decodifica token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    user = payload;
    showApp();
    loadRepos(user.login);
  } catch (err) {
    console.error('Token inválido', err);
    logout();
  }
}

// ----------------------
// Funções de UI
// ----------------------
function showApp() {
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  userInfoDiv.innerHTML = `
    <img src="${user.avatar_url}" alt="${user.name}" class="avatar" /> 
    ${user.name}
  `;
}

function showLogin() {
  loginScreen.style.display = 'flex';
  app.style.display = 'none';
}

// ----------------------
// Login / Logout
// ----------------------
loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

logoutBtn.addEventListener('click', () => {
  logout();
});

function logout() {
  token = null;
  user = null;
  showLogin();
}

// ----------------------
// Repositórios
// ----------------------
async function loadRepos(username) {
  if (!token) return;
  reposContainer.innerHTML = 'Carregando...';

  try {
    const res = await fetch(`/api/getRepos?username=${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Não foi possível carregar repositórios');
    const repos = await res.json();

    if (!repos || repos.length === 0) {
      reposContainer.innerHTML = 'Nenhum repositório encontrado.';
      return;
    }

    reposContainer.innerHTML = '';
    repos.forEach(r => {
      const div = document.createElement('div');
      div.className = 'repo';
      div.innerHTML = `
        <h3>${r.name}</h3>
        <p>${r.description || ''}</p>
        <a href="${r.html_url}" target="_blank">Ver no GitHub</a>
      `;
      reposContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    reposContainer.innerHTML = 'Erro ao carregar repositórios.';
  }
}

// ----------------------
// Pesquisa
// ----------------------
searchBtn.addEventListener('click', () => {
  const username = searchInput.value.trim();
  if (!username) return alert('Digite um usuário');
  loadRepos(username);
});

// ----------------------
// Inicialização
// ----------------------
window.addEventListener('DOMContentLoaded', () => {
  getSession();
});
