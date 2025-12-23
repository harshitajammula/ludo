/**
 * Authentication Client
 * Handles client-side authentication state and user profile
 */

class AuthClient {
    constructor() {
        this.user = null;
        this.authenticated = false;
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        try {
            const response = await fetch('/auth/status', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to check auth status');
            }

            const data = await response.json();
            this.authenticated = data.authenticated;
            this.user = data.user;

            return data;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.authenticated = false;
            this.user = null;
            return { authenticated: false, user: null };
        }
    }

    /**
     * Get user profile
     */
    async getProfile() {
        try {
            const response = await fetch('/auth/profile', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to get profile');
            }

            const data = await response.json();
            this.user = data.user;
            return data.user;
        } catch (error) {
            console.error('Get profile failed:', error);
            return null;
        }
    }

    /**
     * Logout user
     */
    logout() {
        window.location.href = '/auth/logout';
    }

    /**
     * Get user display name
     */
    getUserName() {
        return this.user ? this.user.name : 'Guest';
    }

    /**
     * Get user picture
     */
    getUserPicture() {
        return this.user ? this.user.picture : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.authenticated;
    }

    /**
     * Get user stats
     */
    getUserStats() {
        if (!this.user) return null;

        return {
            gamesPlayed: this.user.gamesPlayed || 0,
            gamesWon: this.user.gamesWon || 0,
            winRate: this.user.winRate || 0
        };
    }
}

// Create global auth client instance
const authClient = new AuthClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthClient;
}
