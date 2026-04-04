const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

let savedLua = "-- No code pushed yet";
let activeGames = {};
let whitelist = [];
const ADMIN_PASSWORD = "Alt";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount, userId } = req.body;
    
    // Log every request to see if Roblox is reaching the server
    console.log(`Received Heartbeat from: ${gameName} | ID: ${jobId}`);

    if (jobId) {
        activeGames[jobId] = { 
            name: gameName || "Unknown", 
            players: playerCount || 0, 
            lastSeen: Date.now() 
        };
    }
    res.send(savedLua);
});

app.get('/get-games', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const now = Date.now();
    for (const id in activeGames) {
        if (now - activeGames[id].lastSeen > 30000) delete activeGames[id];
    }
    res.json(activeGames);
});

// Other routes (whitelist, push-lua) remain the same...
app.post('/update-whitelist', (req, res) => {
    const { id, action } = req.body;
    if (action === 'add' && !whitelist.includes(id)) whitelist.push(id);
    if (action === 'remove') whitelist = whitelist.filter(i => i !== id);
    res.send("Updated");
});

app.post('/push-lua', (req, res) => {
    const { lua, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Denied");
    savedLua = lua;
    res.send("Pushed");
});

app.listen(PORT, '0.0.0.0', () => console.log(` Nexus Live`));
