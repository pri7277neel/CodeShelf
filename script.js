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

// util
function safeId(str){ return 'id_' + String(str).replace(/[^a-z0-9]/gi, '_'); }
function escapeHtml(s){ if(!s)return ''; return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function cssEscape(str){ return str.replace(/["\\]/g,'\\$&'); }

// LOGIN
loginBtn.addEventListener('click', () => {
  const base = window.location.origin;
  window.location.href = `${base}/api/auth/github`;
});

// THEME
themeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// FILTER UI
favFilterBtn.addEventListener('click', () => {
  activeFilters.favoritesOnly = !activeFilters.favoritesOnly;
  favFilterBtn.classList.toggle('active', activeFilters.favoritesOnly);
  renderCards(currentRepos);
});

searchInput.addEventListener('input', e => {
  activeFilters.query = e.target.value.toLowerCase();
  renderCards(currentRepos);
});

langSelect.addEventListener('change', e => {
  activeFilters.language = e.target.value;
  renderCards(currentRepos);
});

// LOAD REPOS
loadBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if(!username) return alert('Informe um usuário do GitHub!');
  await fetchRepos(username);
});

async function fetchRepos(username){
  try{
    const token = window.location.hash.split('token=')[1];
    if(!token) return alert('Você precisa logar primeiro!');
    const res = await fetch(`/api/getRepos?username=${encodeURIComponent(username)}&token=${token}`);
    if(!res.ok) throw new Error('Não foi possível carregar repositórios. Token pode estar inválido.');
    const data = await res.json();
    currentRepos = data;
    populateLangSelect(data);
    renderCards(data);
  }catch(e){
    alert(e.message);
    console.error(e);
  }
}

function populateLangSelect(repos){
  const langs = [...new Set(repos.map(r=>r.language).filter(Boolean))];
  langSelect.innerHTML = `<option value="">Todas linguagens</option>`;
  langs.forEach(l=>langSelect.insertAdjacentHTML('beforeend',`<option value="${l}">${l}</option>`));
}

// CARDS
function renderCards(repos){
  cardsContainer.innerHTML='';
  repos.forEach(r=>{
    if(activeFilters.favoritesOnly && !favorites.includes(r.full_name)) return;
    if(activeFilters.language && r.language!==activeFilters.language) return;
    if(activeFilters.query && !r.name.toLowerCase().includes(activeFilters.query)) return;

    const fav = favorites.includes(r.full_name) ? '★' : '☆';
    const html = `
      <div class="repo-card" data-fullname="${r.full_name}">
        <img src="${r.image||'https://via.placeholder.com/300x140?text=Repo'}" />
        <button class="fav-btn">${fav}</button>
        <div class="repo-name">${escapeHtml(r.name)}</div>
        <div class="repo-meta">
          <span>${r.language||'--'}</span>
          <span>★ ${r.stargazers_count}</span>
        </div>
      </div>
    `;
    const el = document.createElement('div');
    el.innerHTML = html;
    const card = el.firstElementChild;

    // FAVORITE
    card.querySelector('.fav-btn').addEventListener('click', e=>{
      e.stopPropagation();
      toggleFavorite(r.full_name, e.target);
    });

    // MODAL (imagem)
    card.addEventListener('click', ()=>{
      showModal(r);
    });

    cardsContainer.appendChild(card);
  });
}

// FAVORITE
function toggleFavorite(fullName, btn){
  const idx = favorites.indexOf(fullName);
  if(idx>-1){favorites.splice(idx,1); btn.textContent='☆';}
  else{favorites.push(fullName); btn.textContent='★';}
  localStorage.setItem('cs_favorites', JSON.stringify(favorites));
}

// MODAL
function showModal(repo){
  const modal = document.createElement('div');
  modal.className='repo-modal';
  modal.innerHTML=`
    <div class="modal-content">
      <div class="modal-header">
        <h2>${escapeHtml(repo.name)}</h2>
        <button class="btn-ghost close-btn">✖</button>
      </div>
      <div class="modal-body">
        <div class="modal-left">
          <p>${escapeHtml(repo.description||'Sem descrição')}</p>
          <p><a href="${repo.html_url}" target="_blank">Abrir no GitHub</a></p>
        </div>
        <div class="modal-right">
          <img class="preview-img" src="${repo.image||'https://via.placeholder.com/320x220?text=Repo'}" />
        </div>
      </div>
    </div>
  `;
  modal.querySelector('.close-btn').addEventListener('click',()=>modal.remove());
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
}

// INICIALIZA
document.addEventListener('DOMContentLoaded',()=>{
  const token = window.location.hash.split('token=')[1];
  if(token){
    loginScreen.style.display='none';
    app.style.display='block';
    const payload = JSON.parse(atob(token.split('.')[1]));
    userInfo.innerHTML=`<img src="${payload.avatar_url}" /><div><h3>${payload.login}</h3><p>${payload.name||''}</p></div>`;
  }
});
