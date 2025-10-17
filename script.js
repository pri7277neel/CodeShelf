// ==================== ELEMENTOS ====================
const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const usernameInput = document.getElementById('username');
const loadBtn = document.getElementById('loadBtn');
const searchInput = document.getElementById('searchInput');
const langSelect = document.getElementById('langSelect');
const favFilterBtn = document.getElementById('favFilterBtn');
const themeBtn = document.getElementById('themeBtn');
const cardsContainer = document.getElementById('cardsContainer');
const userInfo = document.getElementById('user-info');

let darkMode = true;
let repositories = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// ==================== LOGIN ====================
loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

// Verifica se o token JWT está no hash da URL
function checkJWT() {
  const hash = window.location.hash;
  if (hash.startsWith('#token=')) {
    const token = hash.split('=')[1];
    localStorage.setItem('jwt', token);
    window.location.hash = '';
    loadUserProfile();
    loginScreen.style.display = 'none';
    app.style.display = 'block';
  } else if (localStorage.getItem('jwt')) {
    loadUserProfile();
    loginScreen.style.display = 'none';
    app.style.display = 'block';
  }
}

// ==================== CARREGAR PERFIL ====================
async function loadUserProfile() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) return;
  try {
    const res = await fetch('/api/getSession', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const data = await res.json();
    if (!data.login) throw new Error('Não autenticado');
    userInfo.textContent = `Olá, ${data.name || data.login}`;
    usernameInput.value = data.login;
    loadRepos(data.login);
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
    cardsContainer.innerHTML = `<p style="color:red;">Erro ao carregar perfil. Faça login novamente.</p>`;
  }
}

// ==================== CARREGAR REPOS ====================
async function loadRepos(user) {
  const jwt = localStorage.getItem('jwt');
  try {
    const res = await fetch(`/api/getRepos?username=${user}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!res.ok) throw new Error('Token inválido ou API falhou');
    repositories = await res.json();
    populateLangFilter();
    renderCards();
  } catch (err) {
    console.error('Não foi possível carregar repositórios:', err);
    cardsContainer.innerHTML = `<p style="color:red;">Erro ao carregar repositórios. Tente logar novamente.</p>`;
  }
}

// ==================== RENDER CARDS ====================
function renderCards() {
  const search = searchInput.value.toLowerCase();
  const langFilter = langSelect.value;
  const filtered = repositories.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search);
    const matchesLang = langFilter ? r.language === langFilter : true;
    return matchesSearch && matchesLang;
  });

  cardsContainer.innerHTML = filtered.length
    ? filtered
        .map(r => {
          const fav = favorites.includes(r.id) ? '★' : '☆';
          return `
            <div class="card">
              <h3>${r.name} <span class="fav" data-id="${r.id}">${fav}</span></h3>
              <p>${r.description || ''}</p>
              <small>${r.language || ''}</small>
            </div>
          `;
        })
        .join('')
    : '<p>Nenhum repositório encontrado.</p>';

  // Favoritar
  document.querySelectorAll('.fav').forEach(el => {
    el.addEventListener('click', e => {
      const id = parseInt(e.target.dataset.id);
      if (favorites.includes(id)) {
        favorites = favorites.filter(f => f !== id);
      } else {
        favorites.push(id);
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      renderCards();
    });
  });
}

// ==================== FILTROS ====================
searchInput.addEventListener('input', renderCards);
langSelect.addEventListener('change', renderCards);
favFilterBtn.addEventListener('click', () => {
  repositories = repositories.map(r => r.favorite = favorites.includes(r.id));
  repositories.sort((a,b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
  renderCards();
});

// Preenche dropdown de linguagens
function populateLangFilter() {
  const langs = [...new Set(repositories.map(r => r.language).filter(Boolean))];
  langSelect.innerHTML = `<option value="">Todas linguagens</option>` +
    langs.map(l => `<option value="${l}">${l}</option>`).join('');
}

// ==================== BOTÃO CARREGAR USER ====================
loadBtn.addEventListener('click', () => {
  const user = usernameInput.value.trim();
  if (user) loadRepos(user);
});

// ==================== THEME ====================
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// ==================== INICIALIZAÇÃO ====================
checkJWT();
