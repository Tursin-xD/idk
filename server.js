const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let currentCommand = "-- No command set"; // This stores the Lua code in memory

// 1. The Web Interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Route for you to update the code from your website
app.post('/update', (req, res) => {
    const { code, password } = req.body;
    if (password !== "YOUR_SECRET_PASSWORD") return res.status(403).send("Wrong Pass");
    
    currentCommand = code;
    console.log("New code received: " + code);
    res.send("Code Updated");
});

// 3. Route for the Roblox game to "fetch" the code
app.get('/get-command', (req, res) => {
    res.send(currentCommand);
});

app.listen(PORT, () => console.log(`Post Office live on port ${PORT}`));
