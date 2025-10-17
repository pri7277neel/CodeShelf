/* CodeShelf — Script.js completo com JWT */

// ELEMENTOS
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

// ==================== UTIL ====================
function safeId(str){ return 'id_' + String(str).replace(/[^a-z0-9]/gi, '_'); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function cssEscape(str){ return str.replace(/["\\]/g,'\\$&'); }

// ==================== LOGIN / JWT ====================
(function handleJWTFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    const token = hash.replace('#token=', '');
    localStorage.setItem('cs_jwt', token);
    window.location.hash = '';
    loginScreen.style.display = 'none';
    app.style.display = 'block';
    // decodifica JWT pra mostrar info do usuário
    const payload = JSON.parse(atob(token.split('.')[1]));
    showUser({
      login: payload.login,
      name: payload.name,
      avatar_url: payload.avatar_url,
    });
  } else {
    // sem token: mostrar login
    const storedToken = localStorage.getItem('cs_jwt');
    if (storedToken) {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      loginScreen.style.display = 'none';
      app.style.display = 'block';
      showUser({
        login: payload.login,
        name: payload.name,
        avatar_url: payload.avatar_url,
      });
    } else {
      loginScreen.style.display = 'flex';
      app.style.display = 'none';
    }
  }
})();

loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github'; // chama o endpoint do backend
});

// ==================== THEME ====================
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// ==================== FILTROS ====================
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

// ==================== LOAD REPOS ====================
loadBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert('Digite um usuário!');
  cardsContainer.innerHTML = '<p>Carregando...</p>';
  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('Usuário não encontrado');
    const user = await userRes.json();
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (!reposRes.ok) throw new Error('Erro ao carregar repositórios');
    const repos = await reposRes.json();
    currentRepos = repos;
    populateLangSelect(repos);
    showUser(user);
    renderRepos(repos);
  } catch (err) {
    cardsContainer.innerHTML = `<p>Erro: ${err.message}</p>`;
  }
});

// ==================== POPULAR SELECT ====================
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

// ==================== MOSTRAR USUÁRIO ====================
function showUser(user){
  userInfo.innerHTML = `
    <img src="${user.avatar_url}" alt="avatar" />
    <div>
      <h3>${user.name || user.login}</h3>
      <p>${user.bio || ''}</p>
      <a href="https://github.com/${user.login}" target="_blank" style="color:var(--accent, #1f6feb)">Ver no GitHub</a>
    </div>
  `;
}

// ==================== RENDER REPOS ====================
function renderRepos(repos){
  cardsContainer.innerHTML = '';
  let filtered = repos.slice();
  if(activeFilters.favoritesOnly) filtered = filtered.filter(r => favorites.includes(r.full_name));
  if(activeFilters.language) filtered = filtered.filter(r => (r.language||'').toLowerCase() === activeFilters.language.toLowerCase());
  if(activeFilters.query) filtered = filtered.filter(r => (r.name||'').toLowerCase().includes(activeFilters.query));

  if(filtered.length === 0){
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

    // favoritar
    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(repo.full_name);
      favBtn.textContent = favorites.includes(repo.full_name) ? '★' : '☆';
      renderRepos(currentRepos);
    });

    // abrir modal
    card.addEventListener('click', () => openModalForRepo(repo));

    cardsContainer.appendChild(card);
  });
}

// ==================== FAVORITOS ====================
function toggleFavorite(fullName){
  if(favorites.includes(fullName)) favorites = favorites.filter(f => f !== fullName);
  else favorites.push(fullName);
  localStorage.setItem('cs_favorites', JSON.stringify(favorites));
}

// ==================== MODAL ====================
function openModalForRepo(repo){
  // código de modal (igual ao que você já tinha)
  // inclui preview de imagem, upload e URL
  // ...
}

// ==================== UPDATE CARD IMAGE ====================
function updateCardImage(fullName, src){
  const card = document.querySelector(`.repo-card[data-fullname="${fullName}"]`);
  if(!card) return renderRepos(currentRepos);
  const img = card.querySelector('.repo-img');
  if(img) img.src = src;
}
