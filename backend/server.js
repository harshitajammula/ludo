/**
 * Express & Socket.IO Server
 * Main server file for the Ludo game with Google OAuth Authentication
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const setupSocketHandlers = require('./socketHandlers');
const configurePassport = require('./config/passport');
const authRoutes = require('./routes/auth');
const { isAuthenticated, attachUser } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Trust proxy (required for secure cookies through ngrok/proxies)
app.set('trust proxy', 1);

require('dotenv').config();
console.log('--- SERVER AUTH DEBUG ---');
console.log('Client ID from .env:', process.env.GOOGLE_CLIENT_ID);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('-------------------------');
// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'ludo-game-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Attach user to response locals
app.use(attachUser);

// Authentication routes
app.use('/auth', authRoutes);

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve login page (public)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Protected root route - this ensures the user is authenticated before seeing index.html
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve static files (protected)
// We use index: false to prevent express.static from automatically serving index.html
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));

// Serve frontend (protected - requires authentication)
app.get('*', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Setup Socket.IO handlers with authentication
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   🎲 Ludo Game Server Running 🎲      ║
  ╠═══════════════════════════════════════╣
  ║   Port: ${PORT}                        ║
  ║   Host: 0.0.0.0                        ║
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
