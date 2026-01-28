// ========== IMPORTER FIREBASE ==========
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, push, set, onValue, remove, onDisconnect } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

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
  theo: { password: "0kzda1910Kz" },
  timothe: { password: "dza&1791ji!" },
  samuel: { password: "azd10fa0219!" }
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
let unreadMessages = 0;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let callDurationInterval = null;

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
  // ✅ Se déconnecter proprement de Firebase
  if (currentUser) {
    const myPresenceRef = ref(database, 'presence/' + currentUser);
    set(myPresenceRef, {
      online: false,
      lastSeen: Date.now()
    }).then(function() {
      localStorage.removeItem("current");
      localStorage.removeItem("isAdmin");
      location.reload();
    }).catch(function() {
      // Si erreur, déconnecter quand même
      localStorage.removeItem("current");
      localStorage.removeItem("isAdmin");
      location.reload();
    });
  } else {
    localStorage.removeItem("current");
    localStorage.removeItem("isAdmin");
    location.reload();
  }
}

/* ================= NOTIFICATIONS ================= */

window.toggleNotifications = function() {
  const icon = document.getElementById('notifIcon');
  const btn = document.querySelector('.btn-icon[onclick*="toggleNotifications"]');
  
  if (!icon || !btn) return; // Protection contre null
  
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
  const btn = document.querySelector('.btn-icon[onclick*="toggleNotifications"]');
  
  if (!icon || !btn) return; // Protection contre null
  
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
  
  // ✅ ACTIVER LA PRÉSENCE EN LIGNE dès la connexion
  setupPresence();
  
  // Vérifier le statut des notifications
  checkNotificationStatus();
  
  // Charger le chat
  loadChat();
  
  // Écouter les appels entrants
  listenForIncomingCalls();
  
  // Écouter les changements en temps réel
  loadStickers();
}

/* ================= ✅ SYSTÈME DE PRÉSENCE EN LIGNE/HORS LIGNE ================= */

function setupPresence() {
  // Référence à la présence de l'utilisateur actuel
  const myPresenceRef = ref(database, 'presence/' + currentUser);
  
  // ✅ SE MARQUER COMME EN LIGNE
  set(myPresenceRef, {
    online: true,
    lastSeen: Date.now()
  });
  
  // ✅ AUTO-DÉCONNEXION Firebase (quand perd la connexion internet)
  const disconnectRef = onDisconnect(myPresenceRef);
  disconnectRef.set({
    online: false,
    lastSeen: Date.now()
  });
  
  // ✅ METTRE À JOUR toutes les 2 minutes (pour prouver qu'on est toujours là)
  setInterval(function() {
    set(myPresenceRef, {
      online: true,
      lastSeen: Date.now()
    });
  }, 120000); // 2 minutes
  
  // ✅ DÉCONNEXION quand on ferme la page
  window.addEventListener('beforeunload', function() {
    set(myPresenceRef, {
      online: false,
      lastSeen: Date.now()
    });
  });
  
  console.log("✅ Système de présence activé pour:", currentUser);
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

/* ================= CHAT ================= */

window.toggleChat = function() {
  const sidebar = document.getElementById('chatSidebar');
  sidebar.classList.toggle('open');
  
  if (sidebar.classList.contains('open')) {
    unreadMessages = 0;
    document.getElementById('chatBadge').style.display = 'none';
    loadChat();
  }
}

window.sendMessage = function() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  const messagesRef = ref(database, 'chat');
  const newMessageRef = push(messagesRef);
  
  set(newMessageRef, {
    author: currentUser,
    message: message,
    timestamp: Date.now()
  }).then(function() {
    input.value = '';
  });
}

function loadChat() {
  const messagesRef = ref(database, 'chat');
  
  onValue(messagesRef, function(snapshot) {
    const data = snapshot.val();
    const container = document.getElementById('chatMessages');
    
    if (!data) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:20px;">Aucun message pour le moment 💬</div>';
      return;
    }
    
    const messages = Object.keys(data).map(function(key) {
      return {
        id: key,
        ...data[key]
      };
    });
    
    messages.sort(function(a, b) {
      return a.timestamp - b.timestamp;
    });
    
    // Compter les nouveaux messages
    const sidebar = document.getElementById('chatSidebar');
    if (!sidebar.classList.contains('open')) {
      const newMsgs = messages.filter(m => m.author !== currentUser && m.timestamp > (Date.now() - 60000));
      if (newMsgs.length > 0) {
        unreadMessages = newMsgs.length;
        const badge = document.getElementById('chatBadge');
        badge.textContent = unreadMessages;
        badge.style.display = 'block';
      }
    }
    
    container.innerHTML = '';
    
    messages.forEach(function(msg) {
      const div = document.createElement('div');
      div.className = 'chat-message' + (msg.author === currentUser ? ' own' : '');
      
      const time = new Date(msg.timestamp);
      const timeStr = time.getHours().toString().padStart(2, '0') + ':' + 
                      time.getMinutes().toString().padStart(2, '0');
      
      div.innerHTML = `
        ${msg.author !== currentUser ? `<div class="author">@${msg.author}</div>` : ''}
        <div class="bubble">${msg.message}</div>
        <div class="time">${timeStr}</div>
      `;
      
      container.appendChild(div);
    });
    
    // Scroll vers le bas
    container.scrollTop = container.scrollHeight;
  });
}

// Support Enter pour envoyer
document.addEventListener('DOMContentLoaded', function() {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

/* ================= APPELS ================= */

window.toggleCall = function() {
  const panel = document.getElementById('callPanel');
  panel.classList.toggle('open');
  
  if (panel.classList.contains('open')) {
    loadOnlineUsers();
  }
}

function loadOnlineUsers() {
  const container = document.getElementById('usersList');
  container.innerHTML = '';
  
  // ✅ LISTER TOUS LES UTILISATEURS et vérifier leur statut EN TEMPS RÉEL
  const allUsers = {...USERS, ...ADMINS};
  
  Object.keys(allUsers).forEach(function(username) {
    if (username === currentUser) return; // Ne pas s'afficher soi-même
    
    const userDiv = document.createElement('div');
    userDiv.className = 'user-item';
    userDiv.id = 'user-' + username;
    
    // ✅ ÉCOUTER EN TEMPS RÉEL le statut de cet utilisateur
    const userPresenceRef = ref(database, 'presence/' + username);
    
    onValue(userPresenceRef, function(snapshot) {
      const presenceData = snapshot.val();
      let isOnline = false;
      
      if (presenceData && presenceData.online === true) {
        // Vérifier que lastSeen est récent (moins de 5 minutes)
        const timeDiff = Date.now() - presenceData.lastSeen;
        isOnline = timeDiff < 300000; // 5 minutes = 300000ms
      }
      
      // Mettre à jour l'affichage
      userDiv.innerHTML = `
        <div class="user-info-item">
          <div class="user-status ${isOnline ? '' : 'offline'}"></div>
          <strong>@${username}</strong>
        </div>
        <button onclick="initiateCall('${username}')" ${!isOnline ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
          📞 ${isOnline ? 'Appeler' : 'Hors ligne'}
        </button>
      `;
    });
    
    container.appendChild(userDiv);
  });
}

window.initiateCall = function(targetUser) {
  // Envoyer une notification d'appel
  const callsRef = ref(database, 'calls/' + targetUser);
  set(callsRef, {
    from: currentUser,
    status: 'ringing',
    timestamp: Date.now()
  });
  
  alert('📞 Appel en cours vers @' + targetUser + '... (en attente de réponse)');
}

window.acceptCall = function() {
  document.getElementById('incomingCall').style.display = 'none';
  document.getElementById('activeCall').style.display = 'flex';
  
  startCall();
}

window.declineCall = function() {
  document.getElementById('incomingCall').style.display = 'none';
}

window.hangupCall = function() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  if (callDurationInterval) {
    clearInterval(callDurationInterval);
  }
  
  document.getElementById('activeCall').style.display = 'none';
}

window.toggleMute = function() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    
    const btn = document.querySelector('.btn-mute');
    btn.textContent = audioTrack.enabled ? '🎤' : '🔇';
  }
}

window.toggleVideo = function() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    
    const btn = document.querySelector('.btn-video');
    btn.textContent = videoTrack.enabled ? '📹' : '📷';
  }
}

async function startCall() {
  try {
    // Demander accès caméra + micro
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    document.getElementById('localVideo').srcObject = localStream;
    
    // Démarrer le compteur de durée
    let seconds = 0;
    callDurationInterval = setInterval(function() {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      document.getElementById('callDuration').textContent = 
        mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
    }, 1000);
    
    // TODO: Implémenter WebRTC pour la connexion peer-to-peer
    // (nécessite un serveur de signaling)
    
  } catch (error) {
    console.error('Erreur accès média:', error);
    alert('❌ Impossible d\'accéder à la caméra/micro. Vérifie les permissions.');
  }
}

// Écouter les appels entrants
function listenForIncomingCalls() {
  const callsRef = ref(database, 'calls/' + currentUser);
  
  onValue(callsRef, function(snapshot) {
    const data = snapshot.val();
    
    if (data && data.status === 'ringing') {
      document.getElementById('callerName').textContent = '@' + data.from;
      document.getElementById('incomingCall').style.display = 'block';
      
      // Jouer un son (optionnel)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYHGmi78OScTgcOUKzn77hiGwU7k9n0zXosBSh+zPLdkUALFmG36+uoVRQLSKPh9L1vIAUrlNXx3I4yBSOAzvHajjcHHG7A8eieTxALUK3o8LljHAU8lNr00XsrBSp/0PPckkAKFGG46+ypVRQLSaTi9b5wIAUsldjx3I4zBSOAz/HbjTcHHnC96+idThALUa7p8bllHAU9ld301XwrBSyBz/PclEAKFGO56+ypVRQKSqXh9cBxIAUrmNjx3I0zBSOB0PHbjjcHHnHA7OudTRALUq/q8bplHAU+ltv01X4rBSyCz/TclUAJFGS56+ypVRQKS6bi9cFxIAUsmdnx3I0zBSOB0PHbjjcHHnLA7OudTRALUrDq8bpmHAU/l9331X4rBSyC0PTcl0AJFmW56+ypVBQKSqfj9cJxIAUrmdnx3Y4yBSJ/z+/bjTYHH3HC7OqeThAKUbHp8rtnHAVAmdv115MrBSyC0fTdl0AJFmW66+ypVRQLSqfj9sJxIAUrmdrx3Y4zBSJ/0e/bjTYHHnHA7OqeThAKUrDp8rtnHAU/l9v01ZArBSyC0PTdl0AKFWO66+ypVRQLSqXj9cJxIAUsmdnx3Y4zBSJ/0O/bjTYGHnC/7OqeThEKUbDp8bpmHAU/l9v01ZErBSyC0PTdl0AKFWO66+ypVRQLSqXj9cJxIAUsmdnx3Y4zBSJ/0O/bjTYGHnC/7OqeThEKUbDp8bpmHAU/l9v01ZErBSyC0PTdl0AKFWO66+ypVRQLSqXj9cJxIAUsmdnx3Y4zBSJ/0O/bjTYGHnC/7OqeThEKUbDp8bpmHAU/l9v01ZErBSyC0PTdl0AKFWO66+ypVRQLSqXj9cJxIAUsmdnx3Y4zBSJ/0O/bjTYGHnC/7OqeThEKUbDp8bpmHAU/l9v01ZErBSyC0PTdl0AK'); 
      audio.play().catch(e => console.log('Audio play failed'));
    }
  });
}
