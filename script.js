// DOM
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const loadBtn = document.getElementById('loadBtn');
const searchInput = document.getElementById('searchInput');
const langSelect = document.getElementById('langSelect');
const cardsContainer = document.getElementById('cardsContainer');
const usernameInput = document.getElementById('username');
const userInfoDiv = document.getElementById('user-info');
const favFilterBtn = document.getElementById('favFilterBtn');

// Session
let token = null;
let user = null;
let repos = [];
let showOnlyFavs = false;

// Login GitHub
loginBtn.addEventListener('click', () => {
  window.location.href = '/api/auth/github';
});

// Get session
async function getSession() {
  try {
    const res = await fetch('/api/getSession');
    if (!res.ok) return;
    const data = await res.json();
    token = data.token;
    user = data.user;
    if (user) {
      loginScreen.style.display = 'none';
      app.style.display = 'block';
      userInfoDiv.innerHTML = `<img src="${user.avatar_url}" alt="${user.name}" class="avatar" /> ${user.name}`;
      loadRepos(user.login);
    }
  } catch (err) {
    console.error(err);
  }
}

// Load repos
async function loadRepos(username) {
  if (!username) username = user?.login;
  try {
    const res = await fetch(`/api/getRepos?username=${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Não foi possível carregar repositórios. Token pode estar inválido.');
    repos = await res.json();
    renderRepos();
  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

// Render repos
function renderRepos() {
  cardsContainer.innerHTML = '';
  let filtered = repos.filter(r => !showOnlyFavs || r.favorite);
  filtered.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${repo.image ? `<img src="${repo.image}" alt="${repo.name}" />` : ''}
      <h3>${repo.name}</h3>
      <p>${repo.description || ''}</p>
      <button class="favorite-btn" onclick="toggleFavorite('${repo.id}')">${repo.favorite ? '★' : '☆'}</button>
    `;
    cardsContainer.appendChild(card);
  });
}

// Toggle favorite
function toggleFavorite(id) {
  const repo = repos.find(r => r.id === id);
  if (!repo) return;
  repo.favorite = !repo.favorite;
  fetch('/api/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ id, favorite: repo.favorite })
  });
  renderRepos();
}

// Load button
loadBtn.addEventListener('click', () => {
  loadRepos(usernameInput.value);
});

// Fav filter
favFilterBtn.addEventListener('click', () => {
  showOnlyFavs = !showOnlyFavs;
  renderRepos();
});

// Search filter
searchInput.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase();
  cardsContainer.innerHTML = '';
  repos.filter(r => r.name.toLowerCase().includes(term))
       .forEach(r => {
         const card = document.createElement('div');
         card.className = 'card';
         card.innerHTML = `
          ${r.image ? `<img src="${r.image}" alt="${r.name}" />` : ''}
          <h3>${r.name}</h3>
          <p>${r.description || ''}</p>
          <button class="favorite-btn" onclick="toggleFavorite('${r.id}')">${r.favorite ? '★' : '☆'}</button>
         `;
         cardsContainer.appendChild(card);
       });
});

// Init
getSession();
