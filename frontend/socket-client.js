/**
 * Socket.IO Client
 * Handles all real-time communication with the server
 */

let socket = null;
let currentPlayerId = null;
let currentRoomId = null;
let currentPlayerName = null;

/**
 * Initialize socket connection
 */
function initializeSocket() {
    // Connect to server (automatically uses window.location for URL)
    socket = io();

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Connected to server');
        showNotification('Connected to server');

        // Try to reconnect to existing session
        attemptSessionReconnect();
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        showNotification('Disconnected from server', 'error');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showNotification('Connection error. Please refresh the page.', 'error');
    });

    // Game events
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarted', handleGameStarted);
    socket.on('diceRolled', handleDiceRolled);
    socket.on('tokenMoved', handleTokenMoved);
    socket.on('gameOver', handleGameOver);
    socket.on('chatMessage', handleChatMessage);
    socket.on('emojiReceived', handleEmojiReceived);

    // Timer events
    socket.on('timerTick', handleTimerTick);
    socket.on('inactivityWarning', handleInactivityWarning);
    socket.on('playerMissedTurn', handlePlayerMissedTurn);
    socket.on('playerEliminated', handlePlayerEliminated);
    socket.on('playerFinished', handlePlayerFinished);

    // Rooms list events
    socket.on('roomsListUpdate', (rooms) => {
        updateRoomsList(rooms);
    });

    // Spectator events
    socket.on('spectatorJoined', (data) => {
        console.log('Spectator joined:', data);
        showNotification(`${data.spectatorName} is now spectating`);
    });
}

/**
 * Save session to localStorage
 */
function saveSession(roomId, playerId, playerName) {
    const session = {
        roomId,
        playerId,
        playerName,
        timestamp: Date.now()
    };
    localStorage.setItem('ludoSession', JSON.stringify(session));

    // Update URL with room code
    const url = new URL(window.location);
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);
}

/**
 * Get session from localStorage
 */
function getSession() {
    const sessionData = localStorage.getItem('ludoSession');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);

    // Check if session is less than 24 hours old
    const hoursSinceSession = (Date.now() - session.timestamp) / (1000 * 60 * 60);
    if (hoursSinceSession > 24) {
        clearSession();
        return null;
    }

    return session;
}

/**
 * Clear session from localStorage
 */
function clearSession() {
    localStorage.removeItem('ludoSession');

    // Clear URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url);
}

// Expose globally for ui.js
window.clearSession = clearSession;

/**
 * Attempt to reconnect to existing session
 */
function attemptSessionReconnect() {
    // Check URL for room code first
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');

    // Get session from localStorage
    const session = getSession();

    if (!session && !roomFromUrl) return;

    const roomId = roomFromUrl || session?.roomId;
    const playerName = session?.playerName;

    if (!roomId || !playerName) return;

    console.log('🔄 Attempting to reconnect to room:', roomId);

    // Try to rejoin the room
    joinRoom(roomId, playerName)
        .then(() => {
            console.log('✅ Successfully reconnected to game');
            showNotification('Reconnected to game! 🎮');
        })
        .catch((error) => {
            console.log('❌ Could not reconnect:', error);
            clearSession();
        });
}

/**
 * Create a new room
 */
function createRoom(playerName) {
    return new Promise((resolve, reject) => {
        socket.emit('createRoom', { playerName }, (response) => {
            if (response.success) {
                currentPlayerId = response.playerId;
                currentRoomId = response.roomId;
                currentPlayerName = playerName;

                // Save session
                saveSession(response.roomId, response.playerId, playerName);

                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Join an existing room
 */
function joinRoom(roomId, playerName) {
    return new Promise((resolve, reject) => {
        socket.emit('joinRoom', { roomId, playerName }, (response) => {
            if (response.success) {
                currentPlayerId = response.playerId;
                currentRoomId = response.roomId;
                currentPlayerName = playerName;

                // Check if joined as spectator
                if (response.isSpectator) {
                    window.isSpectator = true;
                    console.log('Joined as spectator');
                } else {
                    window.isSpectator = false;
                }

                // Save session
                saveSession(response.roomId, response.playerId, playerName);

                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Start the game
 */
function startGame() {
    return new Promise((resolve, reject) => {
        socket.emit('startGame', (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Roll the dice
 */
function rollDice() {
    return new Promise((resolve, reject) => {
        socket.emit('rollDice', (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Move a token
 */
function moveToken(tokenIndex) {
    return new Promise((resolve, reject) => {
        socket.emit('moveToken', { tokenIndex }, (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Send a chat message
 */
function sendChatMessage(message) {
    return new Promise((resolve, reject) => {
        socket.emit('chatMessage', { message }, (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Send an emoji
 */
function sendEmoji(emoji) {
    return new Promise((resolve, reject) => {
        socket.emit('sendEmoji', { emoji }, (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(response.error);
            }
        });
    });
}

/**
 * Get current game state
 */
function getGameState() {
    return new Promise((resolve, reject) => {
        socket.emit('getGameState', (response) => {
            if (response.success) {
                resolve(response.gameState);
            } else {
                reject(response.error);
            }
        });
    });
}

// ==================== Event Handlers ====================

/**
 * Handle player joined event
 */
function handlePlayerJoined(data) {
    console.log('Player joined:', data.player);
    updateLobbyPlayers(data.gameState);
    updateGamePlayers(data.gameState);
    showNotification(`${data.player.name} joined the game`);
}

/**
 * Handle player left event
 */
function handlePlayerLeft(data) {
    console.log('Player left:', data.playerName);
    updateLobbyPlayers(data.gameState);
    updateGamePlayers(data.gameState);
    showNotification(`${data.playerName} left the game`);
}

/**
 * Handle game started event
 */
function handleGameStarted(data) {
    console.log('Game started:', data.gameState);
    showScreen('gameScreen');
    updateGameState(data.gameState);
    showNotification('Game started! 🎮');

    // Show spectator badge if user is spectating
    if (window.isSpectator) {
        document.getElementById('spectatorBadge').style.display = 'flex';
        document.getElementById('rollDiceBtn').disabled = true;
        document.getElementById('rollDiceBtn').textContent = 'Spectating';
    }
}

/**
 * Handle dice rolled event
 */
function handleDiceRolled(data) {
    console.log('Dice rolled:', data.diceValue);

    // Animate dice
    const diceElement = document.getElementById('centralGameControls').querySelector('.dice-display');
    const diceValueElement = document.getElementById('centralDiceValue');

    diceElement.classList.add('rolling');

    setTimeout(() => {
        diceValueElement.textContent = data.diceValue;
        diceElement.classList.remove('rolling');
    }, 500);

    updateGameState(data.gameState);

    if (data.playerId === currentPlayerId) {
        if (data.canMove) {
            showNotification(`You rolled a ${data.diceValue}! Click a token to move.`);
        } else {
            if (data.turnSkipped) {
                showNotification(`You rolled a ${data.diceValue}. No valid moves - turn passed! ⏭️`);
            } else {
                showNotification(`You rolled a ${data.diceValue}. No valid moves.`);
            }
        }
    } else if (data.turnSkipped) {
        const player = data.gameState.players.find(p => p.id === data.playerId);
        if (player) {
            showNotification(`${player.name} rolled ${data.diceValue} - no moves, turn skipped`);
        }
    }
}

/**
 * Handle token moved event
 */
function handleTokenMoved(data) {
    console.log('Token moved:', data);

    if (data.captured) {
        showNotification(`${data.captured.playerName}'s token was captured! 💥`);
    }

    updateGameState(data.gameState);
    renderGameBoard(data.gameState);
}

/**
 * Handle game over event
 */
function handleGameOver(data) {
    console.log('Game over:', data.winner);
    showGameOverModal(data.winner);
}

/**
 * Handle chat message event
 */
function handleChatMessage(data) {
    addChatMessage(data);
    showChatPopup(data);
}

/**
 * Handle emoji received event
 */
function handleEmojiReceived(data) {
    showEmojiAnimation(data.emoji, data.playerName);
    addChatMessage({
        playerName: data.playerName,
        playerColor: data.playerColor,
        message: data.emoji,
        timestamp: data.timestamp
    });
}

// ==================== Timer Event Handlers ====================

/**
 * Handle timer tick event
 */
function handleTimerTick(data) {
    const { remainingTime, currentPlayer } = data;

    if (!currentPlayer) return;

    // Timer display removed from UI as per requirements
    // Keeping logic here for potential background processing or debugging
    if (remainingTime <= 5) {
        // Subtle background warning or sound could go here
    }
}

/**
 * Handle inactivity warning (20 seconds passed)
 */
function handleInactivityWarning(data) {
    const { playerName, playerId } = data;
    if (playerId === currentPlayerId) {
        showNotification('Hurry up! ⚠️ Only 10 seconds left to move.', 'warning');
    } else {
        showNotification(`${playerName} is inactive. Turn will auto-pass in 10s.`, 'info');
    }
}

/**
 * Handle player missed turn event
 */
function handlePlayerMissedTurn(data) {
    const { playerId, missedTurns, eliminated, gameState } = data;

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    // Update central missed turns badge (Strikes)
    const badge = document.getElementById('centralMissedTurnsBadge');
    if (badge && player.id === data.gameState.currentPlayer?.id) {
        badge.textContent = `Strikes: ${missedTurns}/3`;
        badge.style.display = 'block';
    } else if (badge) {
        badge.style.display = 'none';
    }

    // Show notification
    if (playerId === currentPlayerId) {
        showNotification(`You missed your turn! (${missedTurns}/3)`, 'error');
    } else {
        showNotification(`${player.name} missed their turn (${missedTurns}/3)`);
    }

    updateGameState(gameState);
}

/**
 * Handle player eliminated event
 */
function handlePlayerEliminated(data) {
    const { playerId, playerName, gameState } = data;

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    // Mark as eliminated in the game players list
    const playerItem = document.querySelector(`.game-player-item[data-player-id="${playerId}"]`);
    if (playerItem) {
        playerItem.classList.add('eliminated');
    }

    // Show notification
    if (playerId === currentPlayerId) {
        showNotification('You have been eliminated from the game! 💀', 'error');
    } else {
        showNotification(`${playerName} has been eliminated!`);
    }

    updateGameState(gameState);
}

/**
 * Handle player finished event (team play)
 */
function handlePlayerFinished(data) {
    const { playerId, playerColor, teammateColor } = data;

    const player = currentGameState?.players.find(p => p.id === playerId);
    if (!player) return;

    showNotification(`${player.name} finished all tokens! 🎉`);

    // If this is the current player, show they can help teammate
    if (playerId === currentPlayerId) {
        showNotification(`You can now help your teammate!`, 'info');
    }
}

/**
 * Update dice rolled handler to show auto-play notification
 */
const originalHandleDiceRolled = handleDiceRolled;
handleDiceRolled = function (data) {
    // Show auto-play notification
    if (data.autoPlay) {
        const player = data.gameState.players.find(p => p.id === data.playerId);
        if (player) {
            showNotification(`⏱️ AUTO-PLAY: ${player.name} rolled ${data.diceValue}`, 'info');
        }
    }

    // Call original handler
    originalHandleDiceRolled(data);
};

/**
 * Update token moved handler to show auto-play notification
 */
const originalHandleTokenMoved = handleTokenMoved;
handleTokenMoved = function (data) {
    // Show auto-play notification
    if (data.autoPlay) {
        const player = data.gameState.players.find(p => p.id === data.playerId);
        if (player) {
            showNotification(`⏱️ AUTO-PLAY: ${player.name}'s token moved`, 'info');
        }
    }

    // Call original handler
    originalHandleTokenMoved(data);
};
