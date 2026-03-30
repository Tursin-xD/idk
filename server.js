--# server.js

const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURATION
const UNIVERSE_ID = "YOUR_UNIVERSE_ID"; 
const WHITELIST = ["YourUser123", "Friend456"]; // Add usernames here

app.use(express.json());

// Serve the website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The Execution Logic
app.post('/execute', async (req, res) => {
    const { username, code } = req.body;

    // 1. Whitelist Check
    if (!WHITELIST.includes(username)) {
        return res.status(403).send("Unauthorized");
    }

    // 2. Send to Roblox via MessagingService
    try {
        await axios.post(
            `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/RemoteExecutor`,
            { message: code },
            { headers: { 'x-api-key': process.env.ROBLOX_API_KEY, 'Content-Type': 'application/json' } }
        );
        res.status(200).send("Executed");
    } catch (err) {
        res.status(500).send("Roblox API Error");
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
