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
let favorites = JSON.parse(localStorage.getItem('cs_favorites')) || [];
let repoImages = JSON.parse(localStorage.getItem('cs_repoImages')) || {};
let currentRepos = [];
let activeFilters = { favoritesOnly: false, language: '', query: '' };
let jwtToken = localStorage.getItem('cs_token') || null;

// -------------------- LOGIN --------------------
function parseTokenFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    const token = hash.replace('#token=', '');
    window.location.hash = '';
    localStorage.setItem('cs_token', token);
    return token;
  }
  return null;
}

jwtToken = parseTokenFromHash() || jwtToken;

if (jwtToken) {
  loginScreen.style.display = 'none';
  app.style.display = 'block';
} else {
  loginScreen.style.display = 'flex';
  app.style.display = 'none';
}

// Botão login
loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

// -------------------- THEME --------------------
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// -------------------- FILTROS --------------------
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

// -------------------- CARREGAR REPOS --------------------
loadBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert('Digite um usuário!');
  if (!jwtToken) return alert('Você precisa estar logado!');

  cardsContainer.innerHTML = '<p>Carregando...</p>';

  try {
    const res = await fetch(`/api/getRepos?username=${username}`, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    if (!res.ok) throw new Error('Não foi possível carregar repositórios. Token pode estar inválido.');
    const repos = await res.json();
    currentRepos = repos;
    populateLangSelect(repos);
    showUser(repos.user);
    renderRepos(repos.list);
  } catch (err) {
    console.error(err);
    cardsContainer.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
});

// -------------------- OUTRAS FUNÇÕES (render, showUser, filtros) --------------------
function populateLangSelect(repos){
  const langs = new Set();
  repos.forEach(r => { if (r.language) langs.add(r.language); });
  langSelect.innerHTML = '<option value="">Todas linguagens</option>';
  Array.from(langs).sort().forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    langSelect.appendChild(opt);
  });
}

function showUser(user){
  userInfo.innerHTML = `
    <img src="${user.avatar_url}" alt="avatar" />
    <div>
      <h3>${user.name || user.login}</h3>
      <p>${user.bio || ''}</p>
      <a href="${user.html_url}" target="_blank" style="color:var(--accent)">Ver no GitHub</a>
    </div>
  `;
}

function renderRepos(repos){
  cardsContainer.innerHTML = '';
  let filtered = repos.slice();
  if (activeFilters.favoritesOnly) filtered = filtered.filter(r => favorites.includes(r.full_name));
  if (activeFilters.language) filtered = filtered.filter(r => (r.language||'').toLowerCase() === activeFilters.language.toLowerCase());
  if (activeFilters.query) filtered = filtered.filter(r => (r.name||'').toLowerCase().includes(activeFilters.query));

  if (filtered.length === 0) {
    cardsContainer.innerHTML = '<p style="padding:1rem;color:var(--muted)">Nenhum repositório encontrado.</p>';
    return;
  }

  filtered.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.dataset.fullname = repo.full_name;

    const imgSrc = repoImages[repo.full_name] || 'https://via.placeholder.com/400x220?text=Sem+imagem';
    card.innerHTML = `
      <img class="repo-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(repo.name)}" />
      <div class="repo-name">${escapeHtml(repo.name)}</div>
      <button class="fav-btn">${favorites.includes(repo.full_name) ? '★' : '☆'}</button>
      <div class="repo-meta">
        <span class="meta-lang">${escapeHtml(repo.language || 'N/A')}</span>
        <span class="meta-stars">★ ${repo.stargazers_count}</span>
      </div>
    `;

    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(repo.full_name);
      favBtn.textContent = favorites.includes(repo.full_name) ? '★' : '☆';
      renderRepos(currentRepos);
    });

    card.addEventListener('click', () => openModalForRepo(repo));
    cardsContainer.appendChild(card);
  });
}

function toggleFavorite(fullName){
  if (favorites.includes(fullName)) favorites = favorites.filter(f => f !== fullName);
  else favorites.push(fullName);
  localStorage.setItem('cs_favorites', JSON.stringify(favorites));
}

function escapeHtml(s){
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
}
