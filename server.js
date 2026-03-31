report-log' express = require('express');
const path = require('path');
const app = express();

// Render uses port 10000 by default, but we use process.env for flexibility
const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- DATABASE (In-Memory) ---
let savedLua = "-- No code pushed yet";
let activeGames = {}; // Stores { JobId: { name: "Game Name", players: 0, lastSeen: Date } }

/nearCATION ---
// Change this to your desired password!
const ADMIN_PASSWORD = "Alt";

// --- ROUTES ---
// Add this near your other variables (line 10)
let systemLogs = []; 

// Add this new route for Roblox to send logs to
app.post('/report-log', (req, res) => {
    const { message, gameName } = req.body;
    consconstestamp = new Date().toLocaleTimeString();
    
    // Add new log to the start of the list
    systemLogs.unshift(`[${timestamp}] [${gameName}] ${message}`);
    
    // Keep only the last 50 logs to save memory
    if (systemLogs.length > 50) systemLogs.pop();
    
    res.sendStatus(200);
});

// Add this route for the Website to get the logs
app.get('/get-logs', (req, res) => {
    res.json(systemLogs);
}); 
// 1. Serve the Apple-style Website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
async function fetchLogs() {
    try {
        const res = await fetch('/get-logs');
        const logs = await res.json();
        const consoleBox = document.getElementById('console_output');
        
        consoleBox.innerHTML = logs.map(log => `<div class="log-line">${log}</div>`).join('');
    } catch (e) { console.error("Console sync failed."); }
}
setInterval(fetchLogs, 3000); // Refresh every 3 seconds
// 2. Roblox "Heartbeat" (Roblox calls this every 5-10 seconds)
app.post('/heartbeat', (req, res) => {
    const { jobId, gameName, playerCount } = req.body;
    
    if (!jobId) return res.status(400).send("Missing JobId");

    // Update the game's status in our list
    activeGames[jobId] = {
        name: gameName || "Unknown Game",
        players: playerCount || 0,
        lastSeen: Date.now()
    };

    // Send the currently queued Lua code back to the Roblox server
    res.send(savedLua);
});

// 3. Website API: Get List of Active Games
app.get('/get-games', (req, res) => {
    const now = Date.now();
    
    // Cleanup: Remove games that haven't pinged in over 40 seconds
    for (let id in activeGames) {
        if (now - activeGames[id].lastSeen > 40000) {
            delete activeGames[id];
        }
    }
    
    res.json(activeGames);
});

// 4. Website API: Push New Lua Code
app.post('/push-lua', (req, res) => {
    const { lua, password } = req.body;

    // Security Check
    if (password !== ADMIN_PASSWORD) {
        console.warn(`Unauthorized access attempt with password: ${password}`);
        return res.status(403).send("Unauthorized");
    }

    savedLua = lua;
    console.log("New Payload Queued: " + lua.substring(0, 20) + "...");
    res.send("Payload Synchronized");
});

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`------------------------------------`);
    console.log(` Nexus Admin Suite | Online`);
    console.log(`Port: ${PORT}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`------------------------------------`);
});
