/**
 * Socket.IO Event Handlers
 * Handles all WebSocket events for real-time communication
 */

const gameStateManager = require('./gameState');
const { coinManager } = require('./coinManager');

function setupSocketHandlers(io, sessionMiddleware, passport) {
    // Middleware to use Express session in Socket.io
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    // Middleware to use Passport in Socket.io
    io.use((socket, next) => {
        passport.initialize()(socket.request, {}, () => {
            passport.session()(socket.request, {}, next);
        });
    });

    io.on('connection', (socket) => {
        const user = socket.request.user;
        socket.userId = user ? user.email : socket.id;

        console.log(`Client connected: ${socket.id} (User: ${user ? user.name : 'Guest'})`);

        // Check if user is already in a game (reconnection support)
        const existingRoomId = gameStateManager.getPlayerRoom(socket.userId);
        if (existingRoomId) {
            console.log(`User ${socket.userId} reconnected to room ${existingRoomId}`);
            socket.join(existingRoomId);
            gameStateManager.updatePlayerSocket(socket.userId, socket.id);

            const game = gameStateManager.getRoom(existingRoomId);
            if (game) {
                // Determine if player or spectator
                const player = game.players.find(p => p.id === socket.userId);
                if (player) {
                    player.online = true;
                    // Notify others
                    io.to(existingRoomId).emit('playerOnline', {
                        playerId: socket.userId,
                        playerName: player.name
                    });
                }

                socket.emit('reconnected', {
                    roomId: existingRoomId,
                    playerId: socket.userId,
                    player: player,
                    isSpectator: !player,
                    gameState: game.getGameState()
                });
            }
        }


        /**
         * Create a new game room
         */
        socket.on('createRoom', ({ playerName, roomName, teamMode }, callback) => {
            try {
                const playerId = socket.userId;
                const { success, roomId, game } = gameStateManager.createRoom(roomName || `${playerName}'s Room`, teamMode, playerId);

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

                        // Broadcast updated rooms list to all clients
                        io.emit('roomsListUpdate', gameStateManager.getActiveRooms());
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
         * Add a robot player to the room
         */
        socket.on('addRobot', (callback) => {
            try {
                const playerId = socket.userId;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const metadata = gameStateManager.roomMetadata.get(roomId);

                if (metadata && metadata.creatorId !== playerId) {
                    return callback({ success: false, error: 'Only the room creator can add robots' });
                }

                const result = game.addRobot();

                if (result.success) {
                    // Notify room about new robot
                    io.to(roomId).emit('playerJoined', {
                        player: result.player,
                        gameState: game.getGameState()
                    });

                    // Broadcast updated rooms list
                    io.emit('roomsListUpdate', gameStateManager.getActiveRooms());

                    callback({ success: true });
                } else {
                    callback(result);
                }
            } catch (error) {
                console.error('Error adding robot:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Join an existing game room
         */
        socket.on('joinRoom', ({ roomId, playerName, playerId: providedPlayerId }, callback) => {
            try {
                // If guest, and they provide an ID, adopt it for reconnection
                if (!socket.request.user && providedPlayerId) {
                    socket.userId = providedPlayerId;
                }
                const playerId = socket.userId;

                if (!gameStateManager.roomExists(roomId)) {
                    return callback({ success: false, error: 'Room not found' });
                }

                const game = gameStateManager.getRoom(roomId);
                const existingPlayer = game.players.find(p => p.id === playerId);

                // If game has started or room is full, join as spectator
                // UNLESS the player is already in the game (reconnection)
                if ((game.gameStarted || game.players.length >= 4) && !existingPlayer) {
                    const spectatorResult = gameStateManager.addSpectator(roomId, playerId, playerName, socket.id);

                    if (spectatorResult.success) {
                        socket.join(roomId);

                        callback({
                            success: true,
                            roomId,
                            playerId,
                            isSpectator: true,
                            spectatorName: playerName,
                            gameState: game.getGameState()
                        });

                        // Notify room about new spectator
                        io.to(roomId).emit('spectatorJoined', {
                            spectatorName: playerName,
                            spectatorCount: gameStateManager.getRoomSpectators(roomId).length
                        });

                        // Broadcast updated rooms list
                        io.emit('roomsListUpdate', gameStateManager.getActiveRooms());
                    } else {
                        callback(spectatorResult);
                    }
                } else {
                    // Join as player
                    const result = gameStateManager.joinRoom(roomId, playerId, playerName, socket.id);

                    if (result.success) {
                        socket.join(roomId);

                        callback({
                            success: true,
                            roomId,
                            playerId,
                            isSpectator: false,
                            player: result.player,
                            gameState: game.getGameState()
                        });

                        // Notify all players in room
                        io.to(roomId).emit('playerJoined', {
                            player: result.player,
                            gameState: game.getGameState()
                        });

                        // Broadcast updated rooms list
                        io.emit('roomsListUpdate', gameStateManager.getActiveRooms());
                    } else {
                        callback(result);
                    }
                }
            } catch (error) {
                console.error('Error joining room:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Get list of active rooms
         */
        socket.on('getRooms', (callback) => {
            try {
                const activeRooms = gameStateManager.getActiveRooms();
                callback({
                    success: true,
                    rooms: activeRooms
                });
            } catch (error) {
                console.error('Error getting rooms:', error);
                callback({ success: false, error: 'Server error' });
            }
        });

        /**
         * Start the game
         */
        socket.on('startGame', (callback) => {
            try {
                const playerId = socket.userId;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);
                const metadata = gameStateManager.roomMetadata.get(roomId);

                if (metadata && metadata.creatorId !== playerId) {
                    return callback({ success: false, error: 'Only the room creator can start the game' });
                }

                const result = game.startGame();

                if (result.success) {
                    // Update room status
                    gameStateManager.updateRoomStatus(roomId, 'in_progress');

                    callback({ success: true });

                    // Notify all players that game has started
                    io.to(roomId).emit('gameStarted', {
                        gameState: game.getGameState()
                    });

                    // Start turn timer for first player
                    gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                    checkAndProcessRobotTurn(roomId);

                    // Broadcast updated rooms list
                    io.emit('roomsListUpdate', gameStateManager.getActiveRooms());
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
                const playerId = socket.userId;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (!roomId) {
                    return callback({ success: false, error: 'Not in a room' });
                }

                const game = gameStateManager.getRoom(roomId);

                // Reset missed turns on manual action
                game.resetMissedTurns(playerId);

                const result = game.rollDice(playerId);

                if (result.success) {
                    // Clear timer (player took action)
                    gameStateManager.clearRoomTimer(roomId);

                    callback(result);

                    // Notify all players about dice roll
                    io.to(roomId).emit('diceRolled', {
                        playerId,
                        diceValue: result.diceValue,
                        canMove: result.canMove,
                        turnSkipped: result.turnSkipped,
                        gameState: game.getGameState()
                    });

                    // Restart timer for next action (either selecting a token or next player's roll)
                    gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                    checkAndProcessRobotTurn(roomId);
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
                const playerId = socket.userId;
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
                        playerFinished: result.playerFinished,
                        teamVictory: result.teamVictory,
                        autoPlay: result.autoPlay,
                        gameState: game.getGameState()
                    });

                    // If player finished, notify about teammate control
                    if (result.playerFinished && game.teamMode) {
                        const player = game.players.find(p => p.id === playerId);
                        const teammateColor = game.getTeammateColor(player.color);
                        if (teammateColor) {
                            io.to(roomId).emit('playerFinished', {
                                playerId,
                                playerColor: player.color,
                                teammateColor
                            });
                        }
                    }

                    // If game is over, notify about winner
                    if (result.gameOver) {
                        // Clear timer
                        gameStateManager.clearRoomTimer(roomId);

                        io.to(roomId).emit('gameOver', {
                            winner: result.winner,
                            teamVictory: result.teamVictory,
                            gameState: game.getGameState()
                        });

                        // Update room status
                        gameStateManager.updateRoomStatus(roomId, 'finished');

                        // Broadcast updated rooms list
                        io.emit('roomsListUpdate', gameStateManager.getActiveRooms());
                    } else {
                        // Restart timer for next action (either same player or next)
                        gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                        checkAndProcessRobotTurn(roomId);
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
                const playerId = socket.userId;
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
                const playerId = socket.userId;
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
                const playerId = socket.userId;
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
            console.log(`Client disconnected: ${socket.id} (User: ${user ? user.name : 'Guest'})`);

            const playerId = socket.userId;
            const roomId = gameStateManager.getPlayerRoom(playerId);

            if (roomId) {
                const game = gameStateManager.getRoom(roomId);

                if (game) {
                    const player = game.players.find(p => p.id === playerId);
                    if (player) {
                        player.online = false;
                    }

                    // IMPORTANT: We do NOT remove the player from the game on disconnect
                    // this allows them to rejoin later.
                    // Instead, we just notify other players that they are offline.

                    io.to(roomId).emit('playerDisconnected', {
                        playerId,
                        playerName: player ? player.name : 'Unknown'
                    });

                    // Note: The timer system will still work, and auto-play will
                    // kick in if they don't reconnect in time.
                }
            }
        });

        /**
         * Explicitly leave a room
         */
        socket.on('leaveRoom', (callback) => {
            try {
                const playerId = socket.userId;
                const roomId = gameStateManager.getPlayerRoom(playerId);

                if (roomId) {
                    const game = gameStateManager.getRoom(roomId);
                    const player = game.players.find(p => p.id === playerId);

                    gameStateManager.leaveRoom(playerId);

                    // Notify other players
                    io.to(roomId).emit('playerLeft', {
                        playerId,
                        playerName: player ? player.name : 'Unknown',
                        gameState: game ? game.getGameState() : null
                    });

                    // If no human players remain, notify survivors/spectators
                    if (game && !game.players.some(p => !p.isRobot)) {
                        io.to(roomId).emit('roomClosed', {
                            reason: 'No human players remaining'
                        });
                    }

                    socket.leave(roomId);
                }

                if (callback) callback({ success: true });
            } catch (error) {
                console.error('Error leaving room:', error);
                if (callback) callback({ success: false, error: 'Server error' });
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

    /**
     * Handle timer timeout - Auto-play for inactive player
     */
    function handleTimerTimeout(roomId, game) {
        try {
            const currentPlayer = game.players[game.currentPlayerIndex];

            // Check if player is already eliminated
            if (game.isPlayerEliminated(currentPlayer.id)) {
                game.nextTurn();
                gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                return;
            }

            console.log(`Timer expired for player ${currentPlayer.name} in room ${roomId}`);

            // Auto-roll dice
            const rollResult = game.autoRollDice(currentPlayer.id);

            // Emit auto-roll event
            io.to(roomId).emit('diceRolled', {
                playerId: currentPlayer.id,
                diceValue: rollResult.diceValue,
                canMove: rollResult.canMove,
                autoPlay: true,
                gameState: game.getGameState()
            });

            // Auto-move token if possible
            if (rollResult.canMove) {
                const moveResult = game.autoMoveToken(currentPlayer.id);

                if (moveResult.success && !moveResult.noMove) {
                    // Emit auto-move event
                    io.to(roomId).emit('tokenMoved', {
                        playerId: currentPlayer.id,
                        tokenIndex: moveResult.token?.index,
                        token: moveResult.token,
                        captured: moveResult.captured,
                        anotherTurn: moveResult.anotherTurn,
                        autoPlay: true,
                        gameState: game.getGameState()
                    });

                    // Check for game over
                    if (moveResult.gameOver) {
                        io.to(roomId).emit('gameOver', {
                            winner: moveResult.winner,
                            teamVictory: moveResult.teamVictory,
                            gameState: game.getGameState()
                        });
                        gameStateManager.updateRoomStatus(roomId, 'finished');
                        return;
                    }

                    // If player gets another turn, restart timer
                    if (moveResult.anotherTurn) {
                        gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                        return;
                    }
                }
            }

            // Increment missed turns
            const eliminated = game.incrementMissedTurns(currentPlayer.id);

            // Emit missed turn event
            io.to(roomId).emit('playerMissedTurn', {
                playerId: currentPlayer.id,
                missedTurns: game.playerMissedTurns[currentPlayer.id],
                eliminated,
                gameState: game.getGameState()
            });

            // If player was eliminated
            if (eliminated) {
                io.to(roomId).emit('playerEliminated', {
                    playerId: currentPlayer.id,
                    playerName: currentPlayer.name,
                    gameState: game.getGameState()
                });
            }

            // Start timer for next player
            gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
            checkAndProcessRobotTurn(roomId);

        } catch (error) {
            console.error('Error in timer timeout handler:', error);
            // Try to recover by moving to next turn
            game.nextTurn();
            gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
            checkAndProcessRobotTurn(roomId);
        }
    }

    /**
     * Check if it's a robot's turn and process it
     */
    async function checkAndProcessRobotTurn(roomId) {
        try {
            console.log(`[ROBO] checkAndProcessRobotTurn triggered for room: ${roomId}`);
            const game = gameStateManager.getRoom(roomId);
            if (!game || !game.gameStarted || game.gameOver) return;

            const currentPlayer = game.players[game.currentPlayerIndex];
            if (!currentPlayer || !currentPlayer.isRobot) return;

            console.log(`[ROBO] confirmed ${currentPlayer.name}'s turn in room ${roomId}`);

            // 1. Wait a bit before rolling (simulated thinking)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Re-check game state after delay
            if (!game.gameStarted || game.gameOver || game.players[game.currentPlayerIndex].id !== currentPlayer.id) return;

            // 2. Roll Dice
            const rollResult = game.autoRollDice(currentPlayer.id);
            gameStateManager.clearRoomTimer(roomId);

            io.to(roomId).emit('diceRolled', {
                playerId: currentPlayer.id,
                diceValue: rollResult.diceValue,
                canMove: rollResult.canMove,
                turnSkipped: rollResult.turnSkipped,
                autoPlay: true,
                gameState: game.getGameState()
            });

            if (rollResult.turnSkipped) {
                // Start timer for next player and check for robot
                gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                setTimeout(() => checkAndProcessRobotTurn(roomId), 500);
                return;
            }

            // 3. If can move, weigh options and move
            if (rollResult.canMove) {
                // Simulated thinking before moving
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (!game.gameStarted || game.gameOver || game.players[game.currentPlayerIndex].id !== currentPlayer.id) return;

                const moveResult = game.autoMoveToken(currentPlayer.id);

                io.to(roomId).emit('tokenMoved', {
                    playerId: currentPlayer.id,
                    tokenIndex: moveResult.token?.index,
                    token: moveResult.token,
                    captured: moveResult.captured,
                    anotherTurn: moveResult.anotherTurn,
                    playerFinished: moveResult.playerFinished,
                    teamVictory: moveResult.teamVictory,
                    autoPlay: true,
                    gameState: game.getGameState()
                });

                if (moveResult.gameOver) {
                    io.to(roomId).emit('gameOver', {
                        winner: moveResult.winner,
                        teamVictory: moveResult.teamVictory,
                        gameState: game.getGameState()
                    });
                    gameStateManager.updateRoomStatus(roomId, 'finished');
                    return;
                }

                // Start timer and check if robot gets another turn or next player is robot
                gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                setTimeout(() => checkAndProcessRobotTurn(roomId), 500);
            } else {
                // Should have been handled by turnSkipped but safety first
                gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                setTimeout(() => checkAndProcessRobotTurn(roomId), 500);
            }
        } catch (error) {
            console.error('[ROBO] Critical error:', error);
            // Error recovery: move to next player if possible
            const game = gameStateManager.getRoom(roomId);
            if (game) {
                game.nextTurn();
                gameStateManager.startRoomTimer(roomId, io, handleTimerTimeout);
                setTimeout(() => checkAndProcessRobotTurn(roomId), 500);
            }
        }
    }
}

module.exports = setupSocketHandlers;
