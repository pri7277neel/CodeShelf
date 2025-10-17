document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const mainSection = document.getElementById("main-section");
  const loginBtn = document.getElementById("login-github");
  const profileContainer = document.getElementById("profile");
  const repoContainer = document.getElementById("repos");
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("username");
  const logoutBtn = document.getElementById("logout-btn");

  const BASE_URL = window.location.origin;

  // 🔹 Função: extrai token da URL
  function getTokenFromHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith("#token=")) {
      return hash.replace("#token=", "");
    }
    return null;
  }

  // 🔹 Função: exibe dados do perfil
  async function carregarPerfil() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/profile/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao carregar perfil");

      const data = await res.json();

      profileContainer.innerHTML = `
        <div class="user-info">
          <img src="${data.avatar_url}" class="avatar">
          <h2>${data.name || data.login}</h2>
          <p>@${data.login}</p>
        </div>
      `;

      loginSection.style.display = "none";
      mainSection.style.display = "block";
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      localStorage.removeItem("token");
      loginSection.style.display = "block";
      mainSection.style.display = "none";
    }
  }

  // 🔹 Função: busca repositórios
  async function buscarRepos(username) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/getRepos?username=${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erro ao buscar repositórios");

      const repos = await res.json();

      if (!repos || repos.length === 0) {
        repoContainer.innerHTML = `<p>Nenhum repositório encontrado.</p>`;
        return;
      }

      repoContainer.innerHTML = repos
        .map(
          (repo) => `
        <div class="repo-card">
          <h3>${repo.name}</h3>
          <p>${repo.description || "Sem descrição"}</p>
          <a href="${repo.html_url}" target="_blank">Ver no GitHub</a>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error(err);
      repoContainer.innerHTML = `<p>Erro ao carregar repositórios.</p>`;
    }
  }

  // 🔹 Clique: login com GitHub
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/api/auth/github";
    });
  }

  // 🔹 Clique: buscar repositórios
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const username = searchInput.value.trim();
      if (username) buscarRepos(username);
    });
  }

  // 🔹 Clique: logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }

  // 🔹 Início: checa token na URL ou localStorage
  const tokenFromUrl = getTokenFromHash();
  if (tokenFromUrl) {
    localStorage.setItem("token", tokenFromUrl);
    window.location.hash = "";
    await carregarPerfil();
  } else if (localStorage.getItem("token")) {
    await carregarPerfil();
  } else {
    loginSection.style.display = "block";
    mainSection.style.display = "none";
  }
});
