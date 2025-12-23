/**
 * Game State Management
 * Manages all active game rooms and their states
 */

const LudoGame = require('./gameLogic');
const { v4: uuidv4 } = require('uuid');

class GameStateManager {
    constructor() {
        this.rooms = new Map(); // roomId -> LudoGame
        this.playerRooms = new Map(); // playerId -> roomId
        this.playerSockets = new Map(); // playerId -> socketId
    }

    /**
     * Create a new game room
     */
    createRoom() {
        const roomId = this.generateRoomCode();
        const game = new LudoGame(roomId);
        this.rooms.set(roomId, game);

        return {
            success: true,
            roomId,
            game
        };
    }

    /**
     * Generate a unique 6-character room code
     */
    generateRoomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;

        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }
        } while (this.rooms.has(code));

        return code;
    }

    /**
     * Get a game room
     */
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    /**
     * Join a game room
     */
    joinRoom(roomId, playerId, playerName, socketId) {
        const game = this.rooms.get(roomId);

        if (!game) {
            return { success: false, error: 'Room not found' };
        }

        const result = game.addPlayer(playerId, playerName);

        if (result.success) {
            this.playerRooms.set(playerId, roomId);
            this.playerSockets.set(playerId, socketId);
        }

        return result;
    }

    /**
     * Leave a game room
     */
    leaveRoom(playerId) {
        const roomId = this.playerRooms.get(playerId);

        if (!roomId) {
            return { success: false, error: 'Player not in a room' };
        }

        const game = this.rooms.get(roomId);

        if (game) {
            game.removePlayer(playerId);

            // If room is empty, delete it
            if (game.players.length === 0) {
                this.rooms.delete(roomId);
            }
        }

        this.playerRooms.delete(playerId);
        this.playerSockets.delete(playerId);

        return { success: true, roomId };
    }

    /**
     * Get room ID for a player
     */
    getPlayerRoom(playerId) {
        return this.playerRooms.get(playerId);
    }

    /**
     * Get socket ID for a player
     */
    getPlayerSocket(playerId) {
        return this.playerSockets.get(playerId);
    }

    /**
     * Update player socket ID (for reconnections)
     */
    updatePlayerSocket(playerId, socketId) {
        this.playerSockets.set(playerId, socketId);
    }

    /**
     * Get all players in a room
     */
    getRoomPlayers(roomId) {
        const game = this.rooms.get(roomId);
        return game ? game.players : [];
    }

    /**
     * Check if room exists
     */
    roomExists(roomId) {
        return this.rooms.has(roomId);
    }

    /**
     * Get room count
     */
    getRoomCount() {
        return this.rooms.size;
    }

    /**
     * Clean up empty rooms (can be called periodically)
     */
    cleanupEmptyRooms() {
        const emptyRooms = [];

        for (const [roomId, game] of this.rooms.entries()) {
            if (game.players.length === 0) {
                emptyRooms.push(roomId);
            }
        }

        emptyRooms.forEach(roomId => this.rooms.delete(roomId));

        return emptyRooms.length;
    }
}

// Singleton instance
const gameStateManager = new GameStateManager();

module.exports = gameStateManager;
