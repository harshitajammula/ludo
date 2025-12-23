/**
 * Authentication Middleware
 */

/**
 * Middleware to check if user is authenticated
 */
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    // For API requests, return JSON error
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Please log in to access this resource'
        });
    }

    // For page requests, redirect to login
    res.redirect('/login');
}

/**
 * Middleware to check if user is NOT authenticated (for login/register pages)
 */
function isNotAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }

    // Already logged in, redirect to home
    res.redirect('/');
}

/**
 * Middleware to attach user to response locals (for templates)
 */
function attachUser(req, res, next) {
    res.locals.user = req.user || null;
    next();
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated,
    attachUser
};
