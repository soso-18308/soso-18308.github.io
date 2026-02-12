// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Crée le serveur HTTP et Socket.IO ---
const server = http.createServer(app);
const io = new Server(server);

// --- Fichier de données ---
const DATA_FILE = './data.json';

// --- Middlewares ---
app.use(bodyParser.json());
app.use(express.static('public')); // sert index.html, style.css et autres fichiers statiques

// --- Helpers ---
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ users: [], tasks: [], events: [], messages: [] }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Auth simple ---
app.post('/login', (req, res) => {
  const { username } = req.body;
  const data = readData();
  const user = data.users.find(u => u.username === username);
  if (user) res.json({ success: true, user });
  else res.json({ success: false });
});

// --- Gestion utilisateurs (admin seulement) ---
app.post('/users', (req, res) => {
  const { user } = req.body;
  const data = readData();
  if (!data.users.find(u => u.username === user.username)) {
    data.users.push(user);
    writeData(data);
    res.json({ success: true });
  } else res.json({ success: false, msg: 'Utilisateur existe' });
});

// --- Tâches ---
app.get('/tasks', (req, res) => {
  const data = readData();
  res.json(data.tasks);
});

app.post('/tasks', (req, res) => {
  const data = readData();
  data.tasks.push(req.body);
  writeData(data);
  res.json({ success: true });
});

// --- Événements calendrier ---
app.get('/events', (req, res) => {
  const data = readData();
  res.json(data.events);
});

app.post('/events', (req, res) => {
  const data = readData();
  data.events.push(req.body);
  writeData(data);
  res.json({ success: true });
});

// --- Chat Socket.IO ---
io.on('connection', socket => {
  const data = readData();
  socket.emit('chatHistory', data.messages);

  socket.on('chatMessage', msg => {
    const data = readData(); // recharger pour éviter conflits
    data.messages.push(msg);
    writeData(data);
    io.emit('chatMessage', msg);
  });
});

// --- Démarrage du serveur ---
server.listen(PORT, () => {
  console.log(`Jaguar running on port ${PORT}`);
});
