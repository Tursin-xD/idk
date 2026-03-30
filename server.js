const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

let savedLua = "-- No code pushed yet";
let activeGames = {}; // Stores { JobId: { name: "Game Name", players: 0, lastSeen: Date } }

// 1. Roblox "Heartbeat" + Get Code
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount } = req.body;
    
    // Record the game as active
    activeGames[jobId] = {
        name: gameName,
        players: playerCount,
        lastSeen: Date.now()
    };

    // Send back the current Lua payload
    res.send(savedLua);
});

// 2. Website fetches the list of active games
app.get('/get-games', (req, res) => {
    // Clean up games that haven't pinged in 30 seconds (they likely closed)
    const now = Date.now();
    for (let id in activeGames) {
        if (now - activeGames[id].lastSeen > 30000) {
            delete activeGames[id];
        }
    }
    res.json(activeGames);
});

app.post('/push-lua', (req, res) => {
    savedLua = req.body.lua;
    res.send("Pushed!");
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => console.log(`Apple Suite Live on ${PORT}`));
