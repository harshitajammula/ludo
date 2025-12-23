/**
 * Socket.IO Event Handlers
 * Handles all WebSocket events for real-time communication
 */

const gameStateManager = require('./gameState');

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        /**
         * Create a new game room
         */
        socket.on('createRoom', ({ playerName }, callback) => {
            try {
                const playerId = socket.id;
                const { success, roomId, game } = gameStateManager.createRoom();

                if (success) {
                    const joinResult = gameStateManager.joinRoom(roomId, playerId, playerName, socket.id);

                    if (joinResult.success) {
                        socket.join(roomId);

                        callback({
                            success: true,
                            roomId,
                            playerId,
                            player: joinResult.player,
                            gameState: game.getGameState()
                        });

                        // Notify room about new player
                        io.to(roomId).emit('playerJoined', {
                            player: joinResult.player,
                            gameState: game.getGameState()
                        });
                    } else {
                        callback(joinResult);
                    }
                } else {
                    callback({ success: false, error: 'Failed to create room' });
                }
            } catch (error) {
                console.error('Error creating room:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Join an existing game room
         */
        socket.on('joinRoom', ({ roomId, playerName }, callback) => {
            try {
                const playerId = socket.id;

                if (!gameStateManager.roomExists(roomId)) {
                    return callback({ success: false, error: 'Room not found' });
                }

                const result = gameStateManager.joinRoom(roomId, playerId, playerName, socket.id);

                if (result.success) {
                    socket.join(roomId);
                    const game = gameStateManager.getRoom(roomId);

                    callback({
                        success: true,
                        roomId,
                        playerId,
                        player: result.player,
                        gameState: game.getGameState()
                    });

                    // Notify all players in room
                    io.to(roomId).emit('playerJoined', {
                        player: result.player,
                        gameState: game.getGameState()
                    });
                } else {
                    callback(result);
                }
            } catch (error) {
                console.error('Error joining room:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Start the game
         */
        socket.on('startGame', (callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const result = game.startGame();

                if (result.success) {
                    callback({ success: true });

                    // Notify all players that game has started
                    io.to(roomId).emit('gameStarted', {
                        gameState: game.getGameState()
                    });
                } else {
                    callback(result);
                }
            } catch (error) {
                console.error('Error starting game:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Roll dice
         */
        socket.on('rollDice', (callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const result = game.rollDice(playerId);

                if (result.success) {
                    callback(result);

                    // Notify all players about dice roll
                    io.to(roomId).emit('diceRolled', {
                        playerId,
                        diceValue: result.diceValue,
                        canMove: result.canMove,
                        turnSkipped: result.turnSkipped,
                        gameState: game.getGameState()
                    });
                } else {
                    callback(result);
                }
            } catch (error) {
                console.error('Error rolling dice:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Move token
         */
        socket.on('moveToken', ({ tokenIndex }, callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const result = game.moveToken(playerId, tokenIndex);

                if (result.success) {
                    callback(result);

                    // Notify all players about token movement
                    io.to(roomId).emit('tokenMoved', {
                        playerId,
                        tokenIndex,
                        token: result.token,
                        captured: result.captured,
                        anotherTurn: result.anotherTurn,
                        gameState: game.getGameState()
                    });

                    // If game is over, notify about winner
                    if (result.gameOver) {
                        io.to(roomId).emit('gameOver', {
                            winner: result.winner,
                            gameState: game.getGameState()
                        });
                    }
                } else {
                    callback(result);
                }
            } catch (error) {
                console.error('Error moving token:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Send chat message
         */
        socket.on('chatMessage', ({ message }, callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const player = game.players.find(p => p.id === playerId);

                if (!player) {
                    return callback({ success: false, error: 'Player not found' });
                }

                const chatData = {
                    playerId,
                    playerName: player.name,
                    playerColor: player.color,
                    message,
                    timestamp: Date.now()
                };

                // Broadcast to all players in room
                io.to(roomId).emit('chatMessage', chatData);

                callback({ success: true });
            } catch (error) {
                console.error('Error sending chat message:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Send emoji
         */
        socket.on('sendEmoji', ({ emoji }, callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const player = game.players.find(p => p.id === playerId);

                if (!player) {
                    return callback({ success: false, error: 'Player not found' });
                }

                const emojiData = {
                    playerId,
                    playerName: player.name,
                    playerColor: player.color,
                    emoji,
                    timestamp: Date.now()
                };

                // Broadcast to all players in room
                io.to(roomId).emit('emojiReceived', emojiData);

                callback({ success: true });
            } catch (error) {
                console.error('Error sending emoji:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Get current game state
         */
        socket.on('getGameState', (callback) => {
            try {
                const playerId = socket.id;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                callback({
                    success: true,
                    gameState: game.getGameState()
                });
            } catch (error) {
                console.error('Error getting game state:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

            const playerId = socket.id;
            const roomId = gameStateManager.getPlayerRoom(playerId);

            if (roomId) {
                const game = gameStateManager.getRoom(roomId);

                if (game) {
                    const player = game.players.find(p => p.id === playerId);

                    // Remove player from game
                    gameStateManager.leaveRoom(playerId);

                    // Notify other players
                    io.to(roomId).emit('playerLeft', {
                        playerId,
                        playerName: player ? player.name : 'Unknown',
                        gameState: game.getGameState()
                    });
                }
            }
        });
    });

    // Clean up empty rooms every 5 minutes
    setInterval(() => {
        const cleaned = gameStateManager.cleanupEmptyRooms();
        if (cleaned > 0) {
            console.log(`Cleaned up ${cleaned} empty rooms`);
        }
    }, 5 * 60 * 1000);
}

module.exports = setupSocketHandlers;
