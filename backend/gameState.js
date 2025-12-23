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
        this.spectators = new Map(); // roomId -> Set of spectator IDs
        this.spectatorSockets = new Map(); // spectatorId -> socketId
        this.roomMetadata = new Map(); // roomId -> {name, createdAt, status}
    }

    /**
     * Create a new game room
     */
    createRoom(roomName = 'Game Room') {
        const roomId = this.generateRoomCode();
        const game = new LudoGame(roomId);
        this.rooms.set(roomId, game);
        this.spectators.set(roomId, new Set());

        // Store room metadata
        this.roomMetadata.set(roomId, {
            name: roomName,
            createdAt: Date.now(),
            status: 'waiting' // waiting, in_progress, finished
        });

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

        emptyRooms.forEach(roomId => {
            this.rooms.delete(roomId);
            this.spectators.delete(roomId);
            this.roomMetadata.delete(roomId);
        });

        return emptyRooms.length;
    }

    /**
     * Add a spectator to a room
     */
    addSpectator(roomId, spectatorId, spectatorName, socketId) {
        const game = this.rooms.get(roomId);

        if (!game) {
            return { success: false, error: 'Room not found' };
        }

        const spectatorSet = this.spectators.get(roomId);
        spectatorSet.add(spectatorId);
        this.spectatorSockets.set(spectatorId, socketId);

        return {
            success: true,
            spectatorId,
            spectatorName
        };
    }

    /**
     * Remove a spectator from a room
     */
    removeSpectator(roomId, spectatorId) {
        const spectatorSet = this.spectators.get(roomId);
        if (spectatorSet) {
            spectatorSet.delete(spectatorId);
        }
        this.spectatorSockets.delete(spectatorId);
    }

    /**
     * Get all spectators in a room
     */
    getRoomSpectators(roomId) {
        const spectatorSet = this.spectators.get(roomId);
        return spectatorSet ? Array.from(spectatorSet) : [];
    }

    /**
     * Update room status
     */
    updateRoomStatus(roomId, status) {
        const metadata = this.roomMetadata.get(roomId);
        if (metadata) {
            metadata.status = status;
        }
    }

    /**
     * Get all active rooms (excluding finished games)
     */
    getActiveRooms() {
        const activeRooms = [];

        for (const [roomId, game] of this.rooms.entries()) {
            const metadata = this.roomMetadata.get(roomId);

            // Skip finished games
            if (metadata && metadata.status === 'finished') {
                continue;
            }

            const spectatorCount = this.spectators.get(roomId)?.size || 0;

            activeRooms.push({
                roomId,
                roomName: metadata?.name || 'Game Room',
                playerCount: game.players.length,
                maxPlayers: 4,
                status: metadata?.status || 'waiting',
                createdAt: metadata?.createdAt || Date.now(),
                players: game.players.map(p => ({
                    name: p.name,
                    color: p.color
                })),
                spectatorCount,
                gameStarted: game.gameStarted
            });
        }

        // Sort by creation time (newest first)
        return activeRooms.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Clean up finished games
     */
    cleanupFinishedGames() {
        const finishedRooms = [];

        for (const [roomId, metadata] of this.roomMetadata.entries()) {
            if (metadata.status === 'finished') {
                finishedRooms.push(roomId);
            }
        }

        finishedRooms.forEach(roomId => {
            this.rooms.delete(roomId);
            this.spectators.delete(roomId);
            this.roomMetadata.delete(roomId);
        });

        return finishedRooms.length;
    }
}

// Singleton instance
const gameStateManager = new GameStateManager();

module.exports = gameStateManager;
