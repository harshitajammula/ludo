/**
 * Application Configuration
 */
const CONFIG = {
    // Replace this with your production backend URL
    // For local development on Android emulator, use http://10.0.2.2:3000
    API_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.Capacitor
        ? '' // Use relative paths on web during local development
        : 'https://ludo-vvmt.onrender.com'
};

window.APP_CONFIG = CONFIG;
