// Login simples (pode conectar com /api/auth/github)
const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');

loginBtn.addEventListener('click', () => {
  // Aqui você redireciona para a rota de autenticação
  window.location.href = '/api/auth/github';
});

// Função para buscar repositórios
async function buscarRepos() {
  const usernameInput = document.getElementById('username');
  const username = usernameInput.value.trim();
  const lista = document.getElementById('repoList');

  lista.innerHTML = '';

  if (!username) return;

  try {
    const res = await fetch(`/api/getRepos?username=${username}`);
    const repos = await res.json();

    if (!Array.isArray(repos)) {
      lista.innerHTML = '<li>Erro: resposta inesperada da API.</li>';
      return;
    }

    if (repos.length === 0) {
      lista.innerHTML = '<li>Nenhum repositório encontrado.</li>';
      return;
    }

    repos.forEach(repo => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${repo.url}" target="_blank">${repo.name}</a> - ${repo.language || 'Sem linguagem'}<br>${repo.description || ''}`;
      lista.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    lista.innerHTML = '<li>Erro ao carregar repositórios.</li>';
  }
}

document.getElementById('searchBtn').addEventListener('click', buscarRepos);
