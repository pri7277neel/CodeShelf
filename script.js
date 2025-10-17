const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/github';
  });
}

const searchBtn = document.getElementById('searchBtn');
const usernameInput = document.getElementById('username');
const repoList = document.getElementById('repoList');

if (searchBtn) {
  searchBtn.addEventListener('click', buscarRepos);
}

async function buscarRepos() {
  const username = usernameInput.value.trim();
  repoList.innerHTML = '';

  if (!username) return;

  try {
    const res = await fetch(`/api/getRepos?username=${username}`);
    if (!res.ok) throw new Error('Resposta inesperada da API.');

    const data = await res.json();

    if (!Array.isArray(data)) {
      repoList.innerHTML = '<li>Erro: resposta inesperada da API.</li>';
      return;
    }

    if (data.length === 0) {
      repoList.innerHTML = '<li>Nenhum repositório encontrado.</li>';
      return;
    }

    data.forEach(repo => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${repo.url}" target="_blank">${repo.name}</a>
        <p>${repo.description || ''}</p>
        <small>${repo.language || 'Sem linguagem'}</small>
      `;
      repoList.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    repoList.innerHTML = '<li>Erro ao carregar repositórios.</li>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = window.location.hash.split('=')[1];
  if (token) {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
    history.replaceState(null, null, ' ');
  }
});
