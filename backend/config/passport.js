/**
 * Passport.js Configuration for Google OAuth 2.0
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserService = require('../services/userService');

/**
 * Configure Passport with Google OAuth Strategy
 */
function configurePassport() {
    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await UserService.getUserById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user information from Google profile
                    const googleUser = {
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        picture: profile.photos[0].value
                    };

                    // Find or create user
                    const user = await UserService.findOrCreateUser(googleUser);

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
}

module.exports = configurePassport;
