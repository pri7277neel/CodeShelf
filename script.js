// 3. script.js
// Funções para renderizar a interface e lidar com interações

const app = document.getElementById('app');
const tokenKey = 'jwt_token';

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setToken(token) {
  localStorage.setItem(tokenKey, token);
}

function removeToken() {
  localStorage.removeItem(tokenKey);
}

// Verificar hash para token após redirect
function checkHashForToken() {
  const hash = window.location.hash.substring(1);
  if (hash.startsWith('token=')) {
    const token = hash.split('=')[1];
    setToken(token);
    window.location.hash = ''; // Limpar hash
  }
}

// Renderizar tela de login
function renderLogin() {
  app.innerHTML = `
    <h1>Bem-vindo ao CodeShelf</h1>
    <button id="login-btn">Login com GitHub</button>
  `;
  document.getElementById('login-btn').addEventListener('click', () => {
    window.location.href = '/api/auth/github';
  });
}

// Renderizar perfil e repositórios
async function renderProfileAndRepos() {
  const token = getToken();
  if (!token) {
    renderLogin();
    return;
  }

  try {
    // Obter perfil
    const profileRes = await fetch('/api/profile/get', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!profileRes.ok) throw new Error('Unauthorized');
    const user = await profileRes.json();

    // Obter repositórios
    const reposRes = await fetch('/api/getRepos', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const repos = await reposRes.json();

    app.innerHTML = `
      <div class="profile">
        <img src="${user.avatar_url}" alt="${user.name}">
        <h2>${user.name || user.login}</h2>
        <button id="logout-btn">Logout</button>
      </div>
      <input id="search-input" type="text" placeholder="Buscar repositórios...">
      <div id="repos-grid" class="repos-grid"></div>
      <div id="message"></div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
      removeToken();
      renderLogin();
    });

    const searchInput = document.getElementById('search-input');
    const reposGrid = document.getElementById('repos-grid');
    const message = document.getElementById('message');

    function renderRepos(filteredRepos) {
      reposGrid.innerHTML = '';
      filteredRepos.forEach((repo, index) => {
        const card = document.createElement('div');
        card.className = 'repo-card';
        card.style.animationDelay = `${index * 0.1}s`;
        const imageUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/codeshelf-custom-image.jpg?${Date.now()}`;
        card.innerHTML = `
          <img src="${imageUrl}" alt="Custom Image" onerror="this.src='https://via.placeholder.com/300x150?text=No+Image';">
          <h3>${repo.name}</h3>
          <p>${repo.description || 'Sem descrição'}</p>
          <p>Linguagem: ${repo.language || 'N/A'}</p>
          <a href="${repo.html_url}" target="_blank" class="open-btn">Abrir no GitHub</a>
          <div class="file-upload">
            <label for="file-${repo.id}">Upload Imagem Personalizada</label>
            <input type="file" id="file-${repo.id}" accept="image/*">
          </div>
        `;
        reposGrid.appendChild(card);

        const fileInput = document.getElementById(`file-${repo.id}`);
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('image', file);
          formData.append('repo', repo.full_name);

          try {
            const res = await fetch('/api/saveRepo', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            if (!res.ok) throw new Error('Erro ao salvar');
            message.className = 'message success';
            message.textContent = 'Imagem salva com sucesso!';
            // Atualizar imagem
            card.querySelector('img').src = imageUrl;
          } catch (err) {
            message.className = 'message error';
            message.textContent = err.message;
          }
          setTimeout(() => { message.textContent = ''; }, 3000);
        });
      });
    }

    renderRepos(repos);

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = repos.filter(repo => repo.name.toLowerCase().includes(query));
      renderRepos(filtered);
    });

  } catch (err) {
    removeToken();
    renderLogin();
  }
}

// Inicializar
checkHashForToken();
if (getToken()) {
  renderProfileAndRepos();
} else {
  renderLogin();
}