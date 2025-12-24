/**
 * Authentication Routes
 */

const express = require('express');
const passport = require('passport');
const UserService = require('../services/userService');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Temporary store for mobile auth tokens
const mobileTokens = new Map();

/**
 * GET /auth/google
 */
router.get('/google', (req, res, next) => {
    // Pass the platform into the state parameter
    const platform = req.query.platform === 'mobile' ? 'mobile' : 'web';
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: platform
    })(req, res, next);
});

/**
 * GET /auth/google/callback
 */
router.get('/google/callback', (req, res, next) => {
    const platform = req.query.state;

    passport.authenticate('google', (err, user, info) => {
        if (err || !user) {
            return res.redirect('/login?error=auth_failed');
        }

        req.logIn(user, async (err) => {
            if (err) return res.redirect('/login?error=auth_failed');

            if (platform === 'mobile') {
                // Generate a one-time verification token
                const tempToken = require('crypto').randomBytes(16).toString('hex');
                mobileTokens.set(tempToken, {
                    userId: user.id,
                    expires: Date.now() + 60000 // 1 minute
                });

                // Redirect to the custom app scheme with the token
                // Using 'login' as the host makes it easier for the App to catch
                return res.redirect(`ludo-game://login?token=${tempToken}`);
            }

            res.redirect('/');
        });
    })(req, res, next);
});

/**
 * GET /auth/token-login
 */
router.get('/token-login', async (req, res) => {
    const { token } = req.query;
    const tokenData = mobileTokens.get(token);

    if (tokenData && tokenData.expires > Date.now()) {
        const user = await UserService.getUserById(tokenData.userId);
        if (user) {
            mobileTokens.delete(token); // Use once
            req.logIn(user, (err) => {
                if (err) return res.status(500).json({ success: false });
                return res.json({ success: true, user: UserService.getUserProfile(user) });
            });
            return;
        }
    }

    res.status(401).json({ success: false, error: 'Invalid or expired token' });
});

/**
 * GET /auth/logout
 * Logout user
 */
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.redirect('/login');
        });
    });
});

/**
 * GET /auth/status
 * Check authentication status (API endpoint)
 */
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: UserService.getUserProfile(req.user)
        });
    } else {
        res.json({
            authenticated: false,
            user: null
        });
    }
});

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile', isAuthenticated, (req, res) => {
    res.json({
        user: UserService.getUserProfile(req.user)
    });
});

module.exports = router;
