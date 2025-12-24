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

// Configuration debug logs
console.log('--- SERVER AUTH DEBUG ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('-------------------------');

// CORS configuration
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://localhost',
    'capacitor://localhost',
    'http://localhost'
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // 1. Allow mobile apps (no origin)
        if (!origin) return callback(null, true);

        // 2. Allow localhost (standard for Capacitor)
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }

        // 3. Allow specified frontend URL
        if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }

        // 4. Allow Capacitor specific schemes
        if (origin.startsWith('capacitor://') || origin.startsWith('http://localhost')) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'ludo-game-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Required for sameSite: 'none'
        httpOnly: true,
        sameSite: 'none', // Allow cross-site cookies for the mobile app
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
