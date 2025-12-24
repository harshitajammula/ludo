/**
 * Authentication Routes
 */

const express = require('express');
const passport = require('passport');
const UserService = require('../services/userService');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get('/google',
    isNotAuthenticated,
    (req, res, next) => {
        // Save platform in session to know where to redirect after callback
        if (req.query.platform === 'mobile') {
            req.session.platform = 'mobile';
        } else {
            req.session.platform = 'web';
        }
        next();
    },
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login?error=auth_failed'
    }),
    (req, res) => {
        // If it was a mobile request, redirect to the app via custom scheme
        if (req.session.platform === 'mobile') {
            // Clean up session platform flag
            delete req.session.platform;
            return res.redirect('ludo-game://home');
        }

        // Otherwise redirect to web home
        res.redirect('/');
    }
);

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
