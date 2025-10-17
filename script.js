// script.js
const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loadBtn = document.getElementById('loadBtn');
const usernameInput = document.getElementById('username');
const themeBtn = document.getElementById('themeBtn');
const cardsContainer = document.getElementById('cardsContainer');
const userInfo = document.getElementById('user-info');

const searchInput = document.getElementById('searchInput');
const langSelect = document.getElementById('langSelect');
const favFilterBtn = document.getElementById('favFilterBtn');

let darkMode = true;
let token = localStorage.getItem('cs_token') || '';
let favorites = JSON.parse(localStorage.getItem('cs_favorites')) || [];
let currentRepos = [];
let activeFilters = { favoritesOnly: false, language: '', query: '' };

// ------------------- UTIL -------------------
function safeId(str) {
  return 'id_' + String(str).replace(/[^a-z0-9]/gi, '_');
}
function escapeHtml(s){
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ------------------- LOGIN -------------------
function handleLogin() {
  window.location.href = '/api/github';
}
loginBtn.addEventListener('click', handleLogin);

// verifica se tem token no hash
(function checkHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    token = hash.replace('#token=', '');
    localStorage.setItem('cs_token', token);
    window.location.hash = '';
  }
  if (token) initApp();
})();

function initApp() {
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  fetchUser();
}

// ------------------- THEME -------------------
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// ------------------- FILTERS -------------------
favFilterBtn.addEventListener('click', () => {
  activeFilters.favoritesOnly = !activeFilters.favoritesOnly;
  favFilterBtn.classList.toggle('active', activeFilters.favoritesOnly);
  renderRepos(currentRepos);
});
searchInput.addEventListener('input', () => {
  activeFilters.query = searchInput.value.trim().toLowerCase();
  renderRepos(currentRepos);
});
langSelect.addEventListener('change', () => {
  activeFilters.language = langSelect.value;
  renderRepos(currentRepos);
});

// ------------------- FETCH USER -------------------
async function fetchUser() {
  try {
    const res = await fetch('/api/getSession', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Token inválido');
    const user = await res.json();
    showUser(user);
  } catch(err) {
    console.error(err);
    alert('Erro ao validar login. Faça login novamente.');
    localStorage.removeItem('cs_token');
    location.reload();
  }
}

function showUser(user){
  userInfo.innerHTML = `
    <img src="${user.avatar_url}" alt="avatar" />
    <div>
      <h3>${user.login}</h3>
    </div>
  `;
}

// ------------------- LOAD REPOS -------------------
loadBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert('Digite um usuário!');
  cardsContainer.innerHTML = '<p>Carregando...</p>';
  try {
    const res = await fetch(`/api/getRepos?username=${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Não foi possível carregar repositórios. Token pode estar inválido.');
    const repos = await res.json();
    currentRepos = repos;
    populateLangSelect(repos);
    renderRepos(repos);
  } catch(err) {
    console.error(err);
    cardsContainer.innerHTML = `<p style="padding:1rem;color:#999">${err.message}</p>`;
  }
});

function populateLangSelect(repos){
  const langs = new Set();
  repos.forEach(r => { if(r.language) langs.add(r.language); });
  langSelect.innerHTML = '<option value="">Todas linguagens</option>';
  Array.from(langs).sort().forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    langSelect.appendChild(opt);
  });
}

// ------------------- RENDER -------------------
function renderRepos(repos){
  cardsContainer.innerHTML = '';
  let filtered = repos.slice();
  if (activeFilters.favoritesOnly) filtered = filtered.filter(r => favorites.includes(r.full_name));
  if (activeFilters.language) filtered = filtered.filter(r => (r.language||'').toLowerCase() === activeFilters.language.toLowerCase());
  if (activeFilters.query) filtered = filtered.filter(r => (r.name||'').toLowerCase().includes(activeFilters.query));
  
  if(filtered.length === 0){
    cardsContainer.innerHTML = '<p style="padding:1rem;color:#999">Nenhum repositório encontrado.</p>';
    return;
  }

  filtered.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.dataset.fullname = repo.full_name;
    card.innerHTML = `
      <img class="repo-img" src="https://via.placeholder.com/400x220?text=Sem+imagem" />
      <div class="repo-name">${escapeHtml(repo.name)}</div>
      <button class="fav-btn">${favorites.includes(repo.full_name) ? '★' : '☆'}</button>
      <div class="repo-meta">
        <span class="meta-lang">${escapeHtml(repo.language||'N/A')}</span>
        <span class="meta-stars">★ ${repo.stargazers_count}</span>
      </div>
    `;

    // favoritar
    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', e=>{
      e.stopPropagation();
      toggleFavorite(repo.full_name);
      favBtn.textContent = favorites.includes(repo.full_name) ? '★' : '☆';
      renderRepos(currentRepos);
    });

    cardsContainer.appendChild(card);
  });
}

function toggleFavorite(fullName){
  if(favorites.includes(fullName)) favorites = favorites.filter(f=>f!==fullName);
  else favorites.push(fullName);
  localStorage.setItem('cs_favorites', JSON.stringify(favorites));
}
