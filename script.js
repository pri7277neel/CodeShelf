document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const profileSection = document.getElementById("profile-section");
  const loginButton = document.getElementById("login-github");
  const logoutButton = document.getElementById("logout");
  const searchButton = document.getElementById("searchRepos");
  const repoSearch = document.getElementById("repoSearch");
  const reposContainer = document.getElementById("repos");
  const avatarImg = document.getElementById("avatar");
  const nameEl = document.getElementById("name");
  const usernameEl = document.getElementById("username");

  // Função para exibir a tela correta
  function showSection(section) {
    document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
    section.classList.add("active");
  }

  // Verifica se o token está no hash da URL
  const hash = window.location.hash;
  if (hash && hash.includes("token=")) {
    const token = hash.split("token=")[1];
    localStorage.setItem("token", token);
    window.location.hash = "";
  }

  const token = localStorage.getItem("token");

  if (token) {
    // Usuário logado → mostra perfil
    showSection(profileSection);

    fetch("/api/profile/get", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          nameEl.textContent = data.name;
          usernameEl.textContent = data.login ? `@${data.login}` : "";
          avatarImg.src = data.avatar_url;
        }
      })
      .catch(err => console.error("Erro ao carregar perfil:", err));
  } else {
    // Usuário não logado → mostra login
    showSection(loginSection);
  }

  // Login com GitHub
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      window.location.href = "/api/auth/github";
    });
  }

  // Logout
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token");
      showSection(loginSection);
    });
  }

  // Pesquisa de repositórios
  if (searchButton) {
    searchButton.addEventListener("click", async () => {
      const username = repoSearch.value.trim();
      if (!username) return alert("Digite um nome de usuário!");

      try {
        const res = await fetch(`/api/getRepos?username=${username}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        if (!res.ok) throw new Error("Erro ao buscar repositórios");
        const data = await res.json();

        reposContainer.innerHTML = "";
        data.forEach(repo => {
          const div = document.createElement("div");
          div.classList.add("repo-card");
          div.innerHTML = `
            <h3>${repo.name}</h3>
            <p>${repo.description || "Sem descrição"}</p>
            <a href="${repo.html_url}" target="_blank">Ver no GitHub</a>
          `;
          reposContainer.appendChild(div);
        });
      } catch (error) {
        console.error(error);
        alert("Erro: não foi possível carregar repositórios. Token pode estar inválido.");
      }
    });
  }
});
