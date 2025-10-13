// ELEMENTOS
const loginGitBtn = document.getElementById('loginGitBtn');
const loginSimBtn = document.getElementById('loginSimBtn');
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const usernameInput = document.getElementById('username');
const loadBtn = document.getElementById('loadBtn');
const showFavsBtn = document.getElementById('showFavsBtn');
const userInfoContainer = document.getElementById('user-info');
const reposContainer = document.querySelector('.repos-container');
const searchInput = document.getElementById('searchRepo');
const sortSelect = document.getElementById('sortFilter');
const toggleStatsBtn = document.getElementById('toggleStatsBtn');
const userStatsContainer = document.getElementById('user-stats');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
const compareBtn = document.getElementById('compareBtn');
const compareModal = document.getElementById('compareModal');
const closeCompareBtn = document.getElementById('closeCompare');
const doCompareBtn = document.getElementById('doCompare');
const compareUserAInput = document.getElementById('compareUserA');
const compareUserBInput = document.getElementById('compareUserB');
const compareResult = document.getElementById('compareResult');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentRepos = [];
let showingFavs = false;
let showingStats = false;

// LOGIN SIMULADO
loginSimBtn.addEventListener('click', e => {
  e.preventDefault();
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  showAlert('Login simulado realizado com sucesso!');
});

// LOGIN GITHUB (não funcional)
loginGitBtn.addEventListener('click', e => {
  e.preventDefault();
  showAlert('Login via GitHub não está funcionando no momento!');
});

// ALERTA
function showAlert(msg){
  const alertDiv = document.getElementById('loginAlert');
  alertDiv.textContent = msg;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '1rem';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translateX(-50%)';
  alertDiv.style.background = '#1f6feb';
  alertDiv.style.padding = '0.8rem 1.5rem';
  alertDiv.style.borderRadius = '10px';
  alertDiv.style.color = '#fff';
  alertDiv.style.zIndex = '1000';
  setTimeout(()=>alertDiv.textContent='',3000);
}

// DARK/LIGHT MODE
let darkMode = true;
toggleThemeBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.style.background = darkMode ? 
    'radial-gradient(circle at top left, #0d1117, #0a0d12 70%)' :
    'radial-gradient(circle at top left, #fff, #ddd 70%)';
  document.body.style.color = darkMode ? '#e6edf3' : '#111';
  toggleThemeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// CARREGAR REPOS
loadBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  if(!username) return alert('Digite um usuário!');
  reposContainer.innerHTML = '<div class="loading"></div>';
  userInfoContainer.style.display = 'none';

  try{
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if(!userRes.ok) throw new Error('Usuário não encontrado');
    const user = await userRes.json();

    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if(!reposRes.ok) throw new Error('Erro ao carregar repositórios');
    const repos = await reposRes.json();
    currentRepos = repos;

    displayUserInfo(user);
    renderRepos(repos);
    if(showingStats) renderStatsAsText(repos);
  }catch(err){
    alert(err.message);
    reposContainer.innerHTML = '';
  }
});

// DISPLAY USUÁRIO
function displayUserInfo(user){
  userInfoContainer.style.display = 'flex';
  userInfoContainer.innerHTML = `
    <img src="${user.avatar_url}" alt="Avatar">
    <div class="user-details">
      <h3>${user.name || user.login}</h3>
      <a href="${user.html_url}" target="_blank">Ver no GitHub</a>
      ${user.company ? `<div class="user-meta">🏢 ${user.company}</div>` : ''}
      ${user.bio ? `<div class="user-meta">💬 ${user.bio}</div>` : ''}
      ${user.location ? `<div class="user-meta">📍 ${user.location}</div>` : ''}
      <div class="user-meta">📦 Repositórios públicos: ${user.public_repos}</div>
    </div>
  `;
}

// RENDER REPOS
function renderRepos(repos){
  reposContainer.innerHTML = '';
  if(repos.length === 0){ reposContainer.innerHTML = '<p>Nenhum repositório encontrado.</p>'; return; }
  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      <button class="fav-btn">${favorites.includes(repo.full_name)?'★':'☆'}</button>
      <h3>${repo.name}</h3>
      <p>${repo.description || 'Sem descrição'}</p>
      <small>${repo.language || 'N/A'}</small>
      <button class="more-info-btn">Mais info</button>
      <div class="repo-extra-info">
        <p>⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}</p>
        <p>📦 ${repo.size} KB</p>
        <p>🕒 ${new Date(repo.updated_at).toLocaleDateString()}</p>
        <a href="${repo.html_url}" target="_blank">Abrir no GitHub</a>
      </div>
    `;
    const moreBtn = card.querySelector('.more-info-btn');
    moreBtn.addEventListener('click', ()=>card.classList.toggle('expanded'));
    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', ()=>{
      if(favorites.includes(repo.full_name)) favorites = favorites.filter(f=>f!==repo.full_name);
      else favorites.push(repo.full_name);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      favBtn.textContent = favorites.includes(repo.full_name)?'★':'☆';
    });
    reposContainer.appendChild(card);
  });
}

// FILTRAR E ORDENAR
searchInput.addEventListener('input', filterAndRender);
sortSelect.addEventListener('change', filterAndRender);

function filterAndRender(){
  let filtered = [...currentRepos];
  if(showingFavs) filtered = filtered.filter(r=>favorites.includes(r.full_name));
  if(searchInput.value) filtered = filtered.filter(r=>r.name.toLowerCase().includes(searchInput.value.toLowerCase()));

  const val = sortSelect.value;
  if(val==='stars') filtered.sort((a,b)=>b.stargazers_count-a.stargazers_count);
  if(val==='forks') filtered.sort((a,b)=>b.forks_count-a.forks_count);
  if(val==='updated') filtered.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));

  renderRepos(filtered);
}

// FAVORITOS
showFavsBtn.addEventListener('click', ()=>{
  showingFavs = !showingFavs;
  const filtered = showingFavs ? currentRepos.filter(r=>favorites.includes(r.full_name)) : currentRepos;
  renderRepos(filtered);
  showFavsBtn.textContent = showingFavs ? 'Todos Repos' : 'Favoritos ★';
});

// ESTATÍSTICAS EM TEXTO
function renderStatsAsText(repos){
  const langs = {};
  repos.forEach(r=>{ if(r.language) langs[r.language]=(langs[r.language]||0)+1; });
  const langStatsEl = document.getElementById('langStats');
  langStatsEl.innerHTML = Object.keys(langs).length === 0 ? 'Nenhuma linguagem encontrada.' : 
    '<strong>Linguagens usadas:</strong> ' + Object.entries(langs).map(([l,c])=>`${l} (${c})`).join(', ');

  const topStars = [...repos].sort((a,b)=>b.stargazers_count-a.stargazers_count).slice(0,5);
  const topStarsEl = document.getElementById('topStarsStats');
  topStarsEl.innerHTML = topStars.length===0?'Nenhum repositório com stars.':
    '<strong>Top 5 repositórios por stars:</strong> ' + topStars.map(r=>`${r.name} (${r.stargazers_count}★)`).join(', ');
}

// BOTÃO ESTATÍSTICAS
toggleStatsBtn.addEventListener('click', ()=>{
  showingStats = !showingStats;
  userStatsContainer.style.display = showingStats?'block':'none';
  if(showingStats) renderStatsAsText(currentRepos);
  toggleStatsBtn.textContent = showingStats?'❌':'📊';
});

// COMPARAR MODAL
compareBtn.addEventListener('click', ()=>compareModal.style.display='block');
closeCompareBtn.addEventListener('click', ()=>compareModal.style.display='none');
doCompareBtn.addEventListener('click', async ()=>{
  const userA = compareUserAInput.value.trim();
  const userB = compareUserBInput.value.trim();
  if(!userA||!userB){ alert('Digite os dois usuários!'); return; }

  try{
    const resA = await fetch(`https://api.github.com/users/${userA}`);
    const resB = await fetch(`https://api.github.com/users/${userB}`);
    if(!resA.ok||!resB.ok) throw new Error('Usuário não encontrado');
    const dataA = await resA.json();
    const dataB = await resB.json();

    compareResult.innerHTML = `
      <div class="compare-card">
        <h4>${dataA.login}</h4>
        <p>Repositórios públicos: <span>${dataA.public_repos}</span></p>
        <p>Seguidores: <span>${dataA.followers}</span></p>
        <p>Seguindo: <span>${dataA.following}</span></p>
      </div>
      <div class="compare-card">
        <h4>${dataB.login}</h4>
        <p>Repositórios públicos: <span>${dataB.public_repos}</span></p>
        <p>Seguidores: <span>${dataB.followers}</span></p>
        <p>Seguindo: <span>${dataB.following}</span></p>
      </div>
    `;
  }catch(err){ alert(err.message); }
});
