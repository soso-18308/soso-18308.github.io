// ========== IMPORTER FIREBASE ==========
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, push, set, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

/* ================= CONFIGURATION FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAqgfCP4pWXGD9iKUfoggAdQ38qfu_JCCo",
  authDomain: "stickers-6335f.firebaseapp.com",
  databaseURL: "https://stickers-6335f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stickers-6335f",
  storageBucket: "stickers-6335f.firebasestorage.app",
  messagingSenderId: "751797654652",
  appId: "1:751797654652:web:ae748eb696d6dede61a5f9"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/* ================= CONFIG - UTILISATEURS PRÉDÉFINIS ================= */

// UTILISATEURS NORMAUX
const USERS = {
  paul: { password: "azd0i91kzao!&" },
  theo: { password: "0kzda1910Kz" }
};

// ADMINISTRATEURS
const ADMINS = {
  admin: { password: "JAOIAe&11k021KDZok" }
};

// Variables globales
let currentUser = null;
let isAdmin = false;
let notificationsEnabled = false;
let lastStickerCount = 0;

/* ================= INIT ================= */

function init() {
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

window.login = function() {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const msg = document.getElementById("loginMsg");
  msg.innerHTML = "";

  console.log("Tentative de connexion:", u);

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

window.logout = function() {
  localStorage.removeItem("current");
  localStorage.removeItem("isAdmin");
  location.reload();
}

/* ================= NOTIFICATIONS ================= */

window.toggleNotifications = function() {
  const icon = document.getElementById('notifIcon');
  const btn = document.querySelector('.btn-notif');
  
  if (!notificationsEnabled) {
    // Activer les notifications
    if ('Notification' in window) {
      Notification.requestPermission().then(function(permission) {
        if (permission === 'granted') {
          notificationsEnabled = true;
          icon.textContent = '🔔';
          btn.classList.add('active');
          localStorage.setItem('notificationsEnabled', 'true');
          
          // Notification de confirmation
          new Notification('StickerShare 🎉', {
            body: 'Notifications activées ! Tu seras alerté des nouveaux stickers.',
            icon: '🔔'
          });
        } else {
          alert('❌ Notifications refusées. Active-les dans les paramètres de ton navigateur.');
        }
      });
    } else {
      alert('❌ Ton navigateur ne supporte pas les notifications.');
    }
  } else {
    // Désactiver les notifications
    notificationsEnabled = false;
    icon.textContent = '🔕';
    btn.classList.remove('active');
    localStorage.setItem('notificationsEnabled', 'false');
  }
}

function checkNotificationStatus() {
  const enabled = localStorage.getItem('notificationsEnabled') === 'true';
  const icon = document.getElementById('notifIcon');
  const btn = document.querySelector('.btn-notif');
  
  if (enabled && Notification.permission === 'granted') {
    notificationsEnabled = true;
    icon.textContent = '🔔';
    btn.classList.add('active');
  } else {
    notificationsEnabled = false;
    icon.textContent = '🔕';
    btn.classList.remove('active');
  }
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
  
  // Vérifier le statut des notifications
  checkNotificationStatus();
  
  // Écouter les changements en temps réel
  loadStickers();
}

/* ================= STICKERS AVEC FIREBASE ================= */

window.upload = function() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const customCat = document.getElementById("customCategory").value.trim();

  if (!file || !customCat) {
    alert("⚠️ Image et nom de catégorie requis");
    return;
  }

  // Vérifier la taille du fichier (max 1MB pour Firebase)
  if (file.size > 1048576) {
    alert("⚠️ L'image est trop grande ! Maximum 1MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    // Référence à la base de données
    const stickersRef = ref(database, 'stickers');
    const newStickerRef = push(stickersRef);
    
    // Données du sticker
    const stickerData = {
      img: e.target.result,
      cat: customCat,
      author: currentUser,
      timestamp: Date.now()
    };
    
    // Envoyer à Firebase
    set(newStickerRef, stickerData)
      .then(function() {
        console.log("Sticker uploadé avec succès !");
        
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
      })
      .catch(function(error) {
        console.error("Erreur upload:", error);
        alert("❌ Erreur lors de l'upload : " + error.message);
      });
  };
  reader.readAsDataURL(file);
}

function loadStickers() {
  const grid = document.getElementById("grid");
  const stickersRef = ref(database, 'stickers');
  
  // Écouter les changements en temps réel
  onValue(stickersRef, function(snapshot) {
    const data = snapshot.val();
    
    console.log("Données Firebase:", data);
    
    if (!data) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🖼️</div>
          <h4>Aucun sticker pour le moment</h4>
          <p>Sois le premier à partager un sticker !</p>
        </div>
      `;
      lastStickerCount = 0;
      return;
    }
    
    // Convertir l'objet en tableau
    const stickersArray = Object.keys(data).map(function(key) {
      return {
        id: key,
        ...data[key]
      };
    });
    
    // Vérifier s'il y a de nouveaux stickers
    if (notificationsEnabled && lastStickerCount > 0 && stickersArray.length > lastStickerCount) {
      const newSticker = stickersArray[0]; // Le plus récent
      if (newSticker.author !== currentUser) {
        new Notification('Nouveau sticker ! 🎉', {
          body: `@${newSticker.author} a partagé un sticker dans "${newSticker.cat}"`,
          icon: '🖼️'
        });
      }
    }
    lastStickerCount = stickersArray.length;
    
    // Trier par timestamp décroissant (plus récent en premier)
    stickersArray.sort(function(a, b) {
      return b.timestamp - a.timestamp;
    });
    
    grid.innerHTML = "";
    
    stickersArray.forEach(function(s) {
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
        <div class="card-actions">
          <button class="btn-download" onclick="downloadSticker('${s.id}', '${s.cat}', '${s.img}')">⬇️ Télécharger</button>
          ${isAdmin ? `<button class="btn-delete" onclick="deleteSticker('${s.id}')">🗑️ Supprimer</button>` : ""}
        </div>
      `;
      grid.appendChild(card);
    });
  });
}

window.deleteSticker = function(id) {
  if (!confirm("Supprimer ce sticker ?")) return;
  
  const stickerRef = ref(database, 'stickers/' + id);
  remove(stickerRef)
    .then(function() {
      console.log("Sticker supprimé !");
    })
    .catch(function(error) {
      console.error("Erreur suppression:", error);
      alert("❌ Erreur lors de la suppression");
    });
}

window.downloadSticker = function(id, category, imageData) {
  // Créer un lien de téléchargement
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `sticker_${category}_${id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
