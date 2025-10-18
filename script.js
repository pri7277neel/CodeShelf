const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const searchBtn = document.getElementById('searchBtn');
const usernameInput = document.getElementById('username');
const repoList = document.getElementById('repoList');

// Redireciona pro GitHub Auth
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    window.location.href = '/api/auth/github';
  });
}

// Busca os repositórios
if (searchBtn) {
  searchBtn.addEventListener('click', buscarRepos);
}

async function buscarRepos() {
  const username = usernameInput.value.trim();
  repoList.innerHTML = '';

  if (!username) {
    repoList.innerHTML = '<li>Digite um nome de usuário válido.</li>';
    return;
  }

  try {
    const res = await fetch(`/api/getRepos?username=${username}`);
    if (!res.ok) throw new Error('Erro ao buscar repositórios');

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      repoList.innerHTML = '<li>Nenhum repositório encontrado.</li>';
      return;
    }

    data.forEach(repo => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${repo.url}" target="_blank">${repo.name}</a>
        <p>${repo.description || 'Sem descrição'}</p>
        <small>${repo.language || 'Sem linguagem'}</small>
      `;
      repoList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    repoList.innerHTML = '<li>Erro ao carregar repositórios.</li>';
  }
}

// Mostra a tela principal se houver token no hash
document.addEventListener('DOMContentLoaded', () => {
  const token = window.location.hash.split('=')[1];
  if (token) {
    loginScreen.classList.remove('active');
    appScreen.classList.add('active');
    history.replaceState(null, null, ' ');
  }
});
