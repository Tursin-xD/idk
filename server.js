const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- DATABASE VARIABLES ---
let savedLua = "-- No code pushed yet";
let activeGames = {};
let systemLogs = [];
const ADMIN_PASSWORD = "Alt"; // CHANGE THIS

// --- ROUTES ---

// Website UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Heartbeat (Roblox -> Server)
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount } = req.body;
    if (jobId) {
        activeGames[jobId] = { name: gameName, players: playerCount, lastSeen: Date.now() };
    }
    res.send(savedLua);
});

// Logs (Roblox -> Server)
app.post('/report-log', (req, res) => {
    const { message, gameName } = req.body;
    systemLogs.unshift(`[${new Date().toLocaleTimeString()}] [${gameName}] ${message}`);
    if (systemLogs.length > 50) systemLogs.pop();
    res.sendStatus(200);
});

// Dashboard Data (Website -> Server)
app.get('/get-games', (req, res) => res.json(activeGames));
app.get('/get-logs', (req, res) => res.json(systemLogs));

// Push Logic (Website -> Server)
app.post('/push-lua', (req, res) => {
    const { lua, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Denied");
    savedLua = lua;
    res.send("Pushed");
});

app.listen(PORT, '0.0.0.0', () => console.log(` Nexus Suite Online on ${PORT}`));
