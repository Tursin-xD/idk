const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- DATABASE ---
let savedLua = "-- No code pushed yet";
let activeGames = {};
let systemLogs = [];
let whitelist = []; // Dynamic list
const ADMIN_PASSWORD = "YOUR_SECRET_PASSWORD"; // CHANGE THIS

// --- ROUTES ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Roblox Heartbeat
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount } = req.body;
    if (jobId) {
        activeGames[jobId] = { 
            name: gameName || "Unknown", 
            players: playerCount || 0, 
            lastSeen: Date.now() 
        };
    }
    res.send(savedLua);
});

// Logs from Roblox
app.post('/report-log', (req, res) => {
    const { message, gameName } = req.body;
    systemLogs.unshift(`[${new Date().toLocaleTimeString()}] [${gameName || 'System'}] ${message}`);
    if (systemLogs.length > 50) systemLogs.pop();
    res.sendStatus(200);
});

// Whitelist Management
app.post('/update-whitelist', (req, res) => {
    const { id, action } = req.body;
    if (action === 'add' && !whitelist.includes(id)) {
        whitelist.push(id);
    } else if (action === 'remove') {
        whitelist = whitelist.filter(i => i !== id);
    }
    res.send("Updated");
});

// Data for Website
app.get('/get-games', (req, res) => res.json(activeGames));
app.get('/get-logs', (req, res) => res.json(systemLogs));

// Push Payload
app.post('/push-lua', (req, res) => {
    const { lua, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Denied");
    savedLua = lua;
    res.send("Pushed");
});

app.listen(PORT, '0.0.0.0', () => console.log(` Nexus Suite Live`));
