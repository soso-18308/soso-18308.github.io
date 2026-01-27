/* ================= CONFIG - UTILISATEURS PRÉDÉFINIS ================= */

// UTILISATEURS NORMAUX
const USERS = {
  paul: { password: "azd0i91kzao!&" },
  theo: { password: "0kzda1910Kz" }
};

// ADMINISTRATEURS
const ADMINS = {
  admin: { password: "JAOIAé&11k021KDZok" }
};

const STICKERS_KEY = "ss_stickers";

// Variables globales
let currentUser = null;
let isAdmin = false;

/* ================= INIT ================= */

function init() {
  // Initialiser le localStorage si nécessaire
  if (!localStorage.getItem(STICKERS_KEY)) {
    localStorage.setItem(STICKERS_KEY, JSON.stringify([]));
  }
  
  // Event listener pour le changement de fichier
  const fileInput = document.getElementById('file');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const label = document.getElementById('fileLabel');
      if (this.files.length > 0) {
        label.textContent = this.files[0].name;
      } else {
        label.textContent = 'Choisir une image';
      }
    });
  }
  
  // Event listener pour la touche Enter
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        login();
      }
    });
  }
  
  // Auto-login si déjà connecté
  autoLogin();
}

// Lancer l'init au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ================= LOGIN ================= */

function login() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const msg = document.getElementById("loginMsg");
  msg.innerHTML = "";

  // Vérifier d'abord dans les admins
  if (ADMINS[u] && ADMINS[u].password === p) {
    currentUser = u;
    isAdmin = true;
    localStorage.setItem("current", u);
    localStorage.setItem("isAdmin", "true");
    showApp();
    return;
  }

  // Sinon vérifier dans les users
  if (USERS[u] && USERS[u].password === p) {
    currentUser = u;
    isAdmin = false;
    localStorage.setItem("current", u);
    localStorage.setItem("isAdmin", "false");
    showApp();
    return;
  }

  msg.innerHTML = '<div class="message error">❌ Identifiants invalides</div>';
}

function autoLogin() {
  const u = localStorage.getItem("current");
  const adminStatus = localStorage.getItem("isAdmin");
  if (!u) return;

  // Vérifier que l'utilisateur existe toujours
  if (adminStatus === "true" && ADMINS[u]) {
    currentUser = u;
    isAdmin = true;
    showApp();
  } else if (adminStatus === "false" && USERS[u]) {
    currentUser = u;
    isAdmin = false;
    showApp();
  } else {
    // L'utilisateur n'existe plus, nettoyer
    localStorage.removeItem("current");
    localStorage.removeItem("isAdmin");
  }
}

function logout() {
  localStorage.removeItem("current");
  localStorage.removeItem("isAdmin");
  location.reload();
}

/* ================= APP ================= */

function showApp() {
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("userName").textContent = currentUser;
  
  const roleElement = document.getElementById("userRole");
  if (isAdmin) {
    roleElement.innerHTML = '<span class="admin-tag">Admin</span>';
  } else {
    roleElement.innerHTML = '';
  }
  
  loadStickers();
}

/* ================= STICKERS ================= */

function upload() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const customCat = document.getElementById("customCategory").value.trim();

  if (!file || !customCat) {
    alert("⚠️ Image et nom de catégorie requis");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const stickers = JSON.parse(localStorage.getItem(STICKERS_KEY));
    stickers.unshift({
      id: Date.now(),
      img: e.target.result,
      cat: customCat,
      author: currentUser
    });
    localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
    loadStickers();
    
    // Reset les champs
    fileInput.value = "";
    document.getElementById("fileLabel").textContent = "Choisir une image";
    document.getElementById("customCategory").value = "";
    
    // Animation de feedback
    const uploadCard = document.querySelector('.upload-card');
    uploadCard.style.animation = 'none';
    setTimeout(function() {
      uploadCard.style.animation = 'fadeIn 0.6s ease';
    }, 10);
  };
  reader.readAsDataURL(file);
}

function loadStickers() {
  const grid = document.getElementById("grid");
  const stickers = JSON.parse(localStorage.getItem(STICKERS_KEY));
  
  if (stickers.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🖼️</div>
        <h4>Aucun sticker pour le moment</h4>
        <p>Sois le premier à partager un sticker !</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = "";

  stickers.forEach(function(s) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${s.img}" alt="Sticker">
      <div class="card-info">
        <small>
          <span class="category-badge">${s.cat}</span>
        </small>
        <small class="author">@${s.author}</small>
      </div>
      ${isAdmin ? `<button onclick="del(${s.id})">🗑️ Supprimer</button>` : ""}
    `;
    grid.appendChild(card);
  });
}

function del(id) {
  if (!confirm("Supprimer ce sticker ?")) return;
  let stickers = JSON.parse(localStorage.getItem(STICKERS_KEY));
  stickers = stickers.filter(function(s) {
    return s.id !== id;
  });
  localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
  loadStickers();

}


