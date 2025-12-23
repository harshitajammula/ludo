/**
 * Express & Socket.IO Server
 * Main server file for the Ludo game
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const setupSocketHandlers = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🎲 Ludo Game Server Running 🎲     ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                        ║
  ║   URL: http://localhost:${PORT}       ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = { app, server, io };
