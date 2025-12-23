/**
 * User Service
 * Handles user data storage and retrieval
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const USERS_FILE = path.join(__dirname, '../data/users.json');

class UserService {
    /**
     * Initialize the users data file if it doesn't exist
     */
    static async initialize() {
        try {
            const dataDir = path.join(__dirname, '../data');
            await fs.mkdir(dataDir, { recursive: true });

            try {
                await fs.access(USERS_FILE);
            } catch {
                // File doesn't exist, create it
                await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
            }
        } catch (error) {
            console.error('Error initializing user service:', error);
        }
    }

    /**
     * Read all users from file
     */
    static async readUsers() {
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading users:', error);
            return [];
        }
    }

    /**
     * Write users to file
     */
    static async writeUsers(users) {
        try {
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Error writing users:', error);
            throw error;
        }
    }

    /**
     * Find user by Google ID
     */
    static async findByGoogleId(googleId) {
        const users = await this.readUsers();
        return users.find(user => user.googleId === googleId);
    }

    /**
     * Find user by internal ID
     */
    static async getUserById(id) {
        const users = await this.readUsers();
        return users.find(user => user.id === id);
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const users = await this.readUsers();
        return users.find(user => user.email === email);
    }

    /**
     * Create a new user
     */
    static async createUser(userData) {
        const users = await this.readUsers();

        const newUser = {
            id: uuidv4(),
            googleId: userData.googleId,
            email: userData.email,
            name: userData.name,
            firstName: userData.firstName,
            lastName: userData.lastName,
            picture: userData.picture,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            gamesPlayed: 0,
            gamesWon: 0
        };

        users.push(newUser);
        await this.writeUsers(users);

        return newUser;
    }

    /**
     * Update user's last login time
     */
    static async updateLastLogin(userId) {
        const users = await this.readUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            await this.writeUsers(users);
            return users[userIndex];
        }

        return null;
    }

    /**
     * Find or create user (used during OAuth login)
     */
    static async findOrCreateUser(googleUser) {
        // Try to find existing user by Google ID
        let user = await this.findByGoogleId(googleUser.googleId);

        if (user) {
            // Update last login
            user = await this.updateLastLogin(user.id);
            return user;
        }

        // Check if user exists with same email (edge case)
        user = await this.findByEmail(googleUser.email);
        if (user) {
            // Update Google ID for existing email
            const users = await this.readUsers();
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex].googleId = googleUser.googleId;
            users[userIndex].lastLogin = new Date().toISOString();
            await this.writeUsers(users);
            return users[userIndex];
        }

        // Create new user
        return await this.createUser(googleUser);
    }

    /**
     * Update user game statistics
     */
    static async updateGameStats(userId, won = false) {
        const users = await this.readUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex !== -1) {
            users[userIndex].gamesPlayed += 1;
            if (won) {
                users[userIndex].gamesWon += 1;
            }
            await this.writeUsers(users);
            return users[userIndex];
        }

        return null;
    }

    /**
     * Get user profile (safe data for client)
     */
    static getUserProfile(user) {
        if (!user) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            gamesPlayed: user.gamesPlayed || 0,
            gamesWon: user.gamesWon || 0,
            winRate: user.gamesPlayed > 0
                ? ((user.gamesWon / user.gamesPlayed) * 100).toFixed(1)
                : 0
        };
    }
}

// Initialize on module load
UserService.initialize();

module.exports = UserService;
