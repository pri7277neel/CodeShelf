/* CodeShelf — Front-end script.js atualizado 100% */

// ELEMENTOS DO DOM
const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const loadBtn = document.getElementById('loadBtn');
const usernameInput = document.getElementById('username');
const themeBtn = document.getElementById('themeBtn');
const cardsContainer = document.getElementById('cardsContainer') || document.querySelector('.cards-container');
const userInfo = document.getElementById('user-info');

const searchInput = document.getElementById('searchInput');
const langSelect = document.getElementById('langSelect');
const favFilterBtn = document.getElementById('favFilterBtn');

let darkMode = true;
let favorites = JSON.parse(localStorage.getItem('cs_favorites')) || [];
let repoImages = JSON.parse(localStorage.getItem('cs_repoImages')) || {};
let currentRepos = [];
let activeFilters = { favoritesOnly: false, language: '', query: '' };
let jwtToken = null;

// UTIL: id seguro
function safeId(str){ return 'id_' + String(str).replace(/[^a-z0-9]/gi, '_'); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function cssEscape(str){ return str.replace(/["\\]/g,'\\$&'); }

// LOGIN & JWT
function processJWTFromHash(){
    const hash = window.location.hash;
    if(hash.startsWith('#token=')){
        jwtToken = hash.replace('#token=', '');
        localStorage.setItem('cs_jwt', jwtToken);
        window.history.replaceState(null,'','/'); // limpa hash
    } else {
        jwtToken = localStorage.getItem('cs_jwt');
    }
}
processJWTFromHash();

// LOGIN SCREEN
if(!jwtToken){
    loginScreen.style.display = 'flex';
    app.style.display = 'none';
} else {
    loginScreen.style.display = 'none';
    app.style.display = 'block';
}

// BTN LOGIN
loginBtn.addEventListener('click', ()=> {
    window.location.href = '/api/auth/github'; // redireciona pra auth
});

// THEME
themeBtn.addEventListener('click', ()=>{
    darkMode = !darkMode;
    document.body.style.background = darkMode ? '#0d1117' : '#fafafa';
    document.body.style.color = darkMode ? '#e6edf3' : '#111';
    themeBtn.textContent = darkMode ? '🌙' : '☀️';
});

// FILTROS
favFilterBtn.addEventListener('click', () => {
    activeFilters.favoritesOnly = !activeFilters.favoritesOnly;
    favFilterBtn.classList.toggle('active', activeFilters.favoritesOnly);
    renderRepos(currentRepos);
});
searchInput.addEventListener('input', ()=> {
    activeFilters.query = searchInput.value.trim().toLowerCase();
    renderRepos(currentRepos);
});
langSelect.addEventListener('change', ()=> {
    activeFilters.language = langSelect.value;
    renderRepos(currentRepos);
});

// CARREGA REPOS DO BACK-END
loadBtn.addEventListener('click', async () => {
    if(!jwtToken) return alert('Você precisa logar primeiro!');
    const username = usernameInput.value.trim();
    if(!username) return alert('Digite um usuário!');
    cardsContainer.innerHTML = '<p>Carregando...</p>';
    try {
        const res = await fetch(`/api/getRepos?username=${encodeURIComponent(username)}`,{
            headers:{'Authorization': `Bearer ${jwtToken}`}
        });
        if(!res.ok) throw new Error('Não foi possível carregar repositórios. Token pode estar inválido.');
        const data = await res.json();
        currentRepos = data.repos || [];
        populateLangSelect(currentRepos);
        showUser(data.user);
        renderRepos(currentRepos);
    } catch(err){
        cardsContainer.innerHTML = `<p>Erro: ${escapeHtml(err.message)}</p>`;
    }
});

// POPULAR SELECT DE LINGUAGENS
function populateLangSelect(repos){
    const langs = new Set();
    repos.forEach(r => { if(r.language) langs.add(r.language); });
    langSelect.innerHTML = '<option value="">Todas linguagens</option>';
    Array.from(langs).sort().forEach(l=>{
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        langSelect.appendChild(opt);
    });
}

// MOSTRAR USUÁRIO
function showUser(user){
    userInfo.innerHTML = `
        <img src="${user.avatar_url}" alt="avatar" />
        <div>
            <h3>${user.name || user.login}</h3>
            <p>${user.bio || ''}</p>
            <a href="${user.html_url}" target="_blank" style="color:var(--accent, #1f6feb)">Ver no GitHub</a>
        </div>
    `;
}

// RENDER REPOS COM FILTROS
function renderRepos(repos){
    cardsContainer.innerHTML = '';
    let filtered = repos.slice();
    if(activeFilters.favoritesOnly) filtered = filtered.filter(r => favorites.includes(r.full_name));
    if(activeFilters.language) filtered = filtered.filter(r => (r.language||'').toLowerCase()===activeFilters.language.toLowerCase());
    if(activeFilters.query) filtered = filtered.filter(r => (r.name||'').toLowerCase().includes(activeFilters.query));
    if(filtered.length===0){
        cardsContainer.innerHTML = '<p style="padding:1rem;color:var(--muted)">Nenhum repositório encontrado.</p>';
        return;
    }
    filtered.forEach(repo=>{
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.dataset.fullname = repo.full_name;
        const imgSrc = repoImages[repo.full_name] || 'https://via.placeholder.com/400x220?text=Sem+imagem';
        card.innerHTML = `
            <img class="repo-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(repo.name)}" />
            <div class="repo-name">${escapeHtml(repo.name)}</div>
            <button class="fav-btn">${favorites.includes(repo.full_name)?'★':'☆'}</button>
            <div class="repo-meta">
                <span class="meta-lang">${escapeHtml(repo.language||'N/A')}</span>
                <span class="meta-stars">★ ${repo.stargazers_count}</span>
            </div>
        `;
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', e=>{
            e.stopPropagation();
            toggleFavorite(repo.full_name);
            favBtn.textContent = favorites.includes(repo.full_name)?'★':'☆';
            renderRepos(currentRepos);
        });
        card.addEventListener('click', ()=> openModalForRepo(repo));
        cardsContainer.appendChild(card);
    });
}

// FAVORITOS
function toggleFavorite(fullName){
    if(favorites.includes(fullName)) favorites = favorites.filter(f=>f!==fullName);
    else favorites.push(fullName);
    localStorage.setItem('cs_favorites', JSON.stringify(favorites));
}

// MODAL
function openModalForRepo(repo){
    const modal = document.createElement('div');
    modal.className = 'repo-modal';
    const safe = safeId(repo.full_name);
    const existingImg = repoImages[repo.full_name] || '';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${escapeHtml(repo.name)}</h2>
                <div>
                    <button class="btn-primary" id="saveClose-${safe}">Salvar & Fechar</button>
                    <span class="modal-close" id="close-${safe}" style="margin-left:12px;cursor:pointer;font-size:20px">✕</span>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-left">
                    <p>${escapeHtml(repo.description || 'Sem descrição')}</p>
                    <p><strong>Linguagem:</strong> ${escapeHtml(repo.language||'N/A')}</p>
                    <p><strong>Stars:</strong> ${repo.stargazers_count} | <strong>Forks:</strong> ${repo.forks_count}</p>
                    <p style="margin-top:.6rem"><a href="${repo.html_url}" target="_blank" style="color:var(--accent)">Abrir no GitHub</a></p>
                    <div style="margin-top:.8rem">
                        <label class="btn-primary" for="file-${safe}">📁 Upload (PC)</label>
                        <input id="file-${safe}" type="file" accept="image/*" style="display:none" />
                        <input id="url-${safe}" type="text" placeholder="Colar URL da imagem aqui" style="width:100%;margin-top:.5rem;padding:.45rem;border-radius:8px;border:none;background:#0d1117;color:var(--text)" />
                        <button class="btn-primary" id="set-url-${safe}" style="width:100%;margin-top:.5rem">Aplicar URL</button>
                    </div>
                </div>
                <div class="modal-right">
                    <img id="preview-${safe}" class="preview-img" src="${escapeHtml(existingImg || 'https://via.placeholder.com/400x220?text=Sem+imagem')}" alt="preview" />
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector(`#close-${safe}`);
    const saveCloseBtn = modal.querySelector(`#saveClose-${safe}`);
    const fileInput = modal.querySelector(`#file-${safe}`);
    const urlInput = modal.querySelector(`#url-${safe}`);
    const setUrlBtn = modal.querySelector(`#set-url-${safe}`);
    const previewImg = modal.querySelector(`#preview-${safe}`);

    closeBtn.addEventListener('click', ()=> modal.remove());
    saveCloseBtn.addEventListener('click', ()=>{
        const current = previewImg.src || '';
        if(current){
            repoImages[repo.full_name] = current;
            localStorage.setItem('cs_repoImages', JSON.stringify(repoImages));
            updateCardImage(repo.full_name,current);
        }
        modal.remove();
    });

    fileInput.addEventListener('change', e=>{
        const file = e.target.files && e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ()=>{
            const dataUrl = reader.result;
            previewImg.src = dataUrl;
            repoImages[repo.full_name] = dataUrl;
            localStorage.setItem('cs_repoImages', JSON.stringify(repoImages));
            updateCardImage(repo.full_name,dataUrl);
        };
        reader.readAsDataURL(file);
    });

    setUrlBtn.addEventListener('click', ()=>{
        const url = urlInput.value.trim();
        if(!url) return alert('Cole uma URL válida!');
        previewImg.src = url;
        repoImages[repo.full_name] = url;
        localStorage.setItem('cs_repoImages', JSON.stringify(repoImages));
        updateCardImage(repo.full_name,url);
    });

    modal.addEventListener('click', ev=>{
        if(ev.target===modal) modal.remove();
    });
}

// ATUALIZA IMAGEM DO CARD
function updateCardImage(fullName, src){
    const card = document.querySelector(`.repo-card[data-fullname="${fullName}"]`);
    if(!card) renderRepos(currentRepos);
    else {
        const img = card.querySelector('.repo-img');
        if(img) img.src = src;
    }
}
