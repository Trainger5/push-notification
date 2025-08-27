const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all origins (for testing)
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║                                                        ║
║     🚀 Test Site Server Running!                      ║
║                                                        ║
║     Test Site:  http://localhost:${PORT}                 ║
║     Backend:    http://localhost:4000                 ║
║                                                        ║
║     Instructions:                                     ║
║     1. Make sure backend is running (npm run dev)    ║
║     2. Get API key from dashboard                    ║
║     3. Open test site and enter API key              ║
║     4. Click "Initialize" and then "Subscribe"       ║
║     5. Send test notifications!                      ║
║                                                        ║
╚══════════════════════════════════════════════════════╝
    `);
});