/**
 * UI Management
 * Handles all UI interactions and updates
 */

// DEBUG MODE - Set to false for production
const DEBUG_MODE = false;

/**
 * Initialize the application
 */
async function initializeApp() {
    // Check authentication first so socket connection has the session
    if (window.authClient) {
        try {
            const authStatus = await authClient.checkAuth();
            console.log('Auth status:', authStatus);

            if (authStatus.authenticated) {
                window.currentUser = authStatus.user;
                // Set name in input if available - default to first name for 'short name'
                const nameInput = document.getElementById('playerNameInput');
                if (nameInput && authStatus.user.name) {
                    const firstName = authStatus.user.name.split(' ')[0];
                    nameInput.value = firstName;
                }
            }
        } catch (error) {
            console.error('Initial auth check failed:', error);
        }
    }

    initializeSocket();
    setupEventListeners();

    // Debug mode: Skip directly to game screen
    if (DEBUG_MODE) {
        loadDebugGameState();
    } else {
        showScreen('welcomeScreen');
        // Fetch active rooms list
        fetchActiveRooms();
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Welcome screen
    document.getElementById('createRoomBtn').addEventListener('click', handleCreateRoom);

    // Lobby screen
    document.getElementById('leaveLobbyBtn').addEventListener('click', handleLeaveLobby);
    document.getElementById('startGameBtn').addEventListener('click', handleStartGame);
    document.getElementById('copyRoomCodeBtn').addEventListener('click', handleCopyRoomCode);

    // Game screen
    document.getElementById('leaveGameBtn').addEventListener('click', handleLeaveGame);

    // Setup player dice buttons (will be initialized when game starts)
    setupPlayerDiceButtons();

    // Chat
    document.getElementById('sendChatBtn').addEventListener('click', handleSendChat);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendChat();
        }
    });

    // Emoji buttons
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.dataset.emoji;
            handleSendEmoji(emoji);
            hideModal('emojiModal'); // Close modal after sending
        });
    });

    // Floating action buttons
    document.getElementById('chatBtn').addEventListener('click', () => {
        showModal('chatModal');
    });
    document.getElementById('emojiBtn').addEventListener('click', () => {
        showModal('emojiModal');
    });

    // Chat modal
    document.getElementById('closeChatModal').addEventListener('click', () => {
        hideModal('chatModal');
    });

    // Emoji modal
    document.getElementById('closeEmojiModal').addEventListener('click', () => {
        hideModal('emojiModal');
    });

    // Game over modal
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
        hideModal('gameOverModal');
        location.reload(); // Simple reload for now
    });

    // Game board click
    document.getElementById('gameBoard').addEventListener('click', handleBoardClick);
}

/**
 * Setup central dice roll button
 */
function setupPlayerDiceButtons() {
    const rollBtn = document.getElementById('centralRollBtn');
    if (rollBtn) {
        rollBtn.addEventListener('click', async () => {
            await handleRollDice();
        });
    }
}

// ==================== Screen Management ====================

/**
 * Show a specific screen
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ==================== Active Rooms List ====================

/**
 * Fetch active rooms from server
 */
function fetchActiveRooms() {
    if (!socket) return;

    socket.emit('getRooms', (response) => {
        if (response.success) {
            displayRoomsList(response.rooms);
        } else {
            showNotification('Failed to load rooms', 'error');
        }
    });
}

/**
 * Display rooms list
 */
function displayRoomsList(rooms) {
    const roomsList = document.getElementById('roomsList');

    if (!rooms || rooms.length === 0) {
        roomsList.innerHTML = `
            <div class="no-rooms">
                <div class="no-rooms-icon">🎲</div>
                <p>No active games</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Create a room to start playing!</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = rooms.map(room => createRoomCard(room)).join('');

    // Add click handlers to all room cards
    document.querySelectorAll('.room-card').forEach(card => {
        card.addEventListener('click', () => {
            const roomId = card.dataset.roomId;
            const room = rooms.find(r => r.roomId === roomId);
            handleRoomClick(room);
        });
    });
}

/**
 * Create HTML for a room card
 */
function createRoomCard(room) {
    const statusClass = room.status === 'waiting' ? 'waiting' : 'in-progress';
    const statusText = room.status === 'waiting' ? 'Waiting' : 'In Progress';
    const buttonText = room.status === 'waiting' ? '🎮 Join Game' : '👁️ Spectate';
    const buttonClass = room.status === 'waiting' ? '' : 'spectate';

    const playerDots = room.players.map(p =>
        `<div class="player-dot ${p.color}"></div>`
    ).join('');

    return `
        <div class="room-card" data-room-id="${room.roomId}">
            <div class="room-card-header">
                <h4 class="room-name">${escapeHtml(room.roomName)}</h4>
                <span class="room-status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="room-info">
                <div class="room-info-item">
                    <span class="room-info-icon">👥</span>
                    <span>${room.playerCount}/4 Players</span>
                </div>
                ${room.spectatorCount > 0 ? `
                    <div class="room-info-item">
                        <span class="room-info-icon">👁️</span>
                        <span>${room.spectatorCount} Spectator${room.spectatorCount > 1 ? 's' : ''}</span>
                    </div>
                ` : ''}
                ${room.players.length > 0 ? `
                    <div class="room-info-item">
                        <div class="room-players-list">${playerDots}</div>
                    </div>
                ` : ''}
            </div>
            <button class="room-join-btn ${buttonClass}">${buttonText}</button>
        </div>
    `;
}

/**
 * Handle room card click
 */
async function handleRoomClick(room) {
    const playerName = document.getElementById('playerNameInput').value.trim();

    if (!playerName) {
        showNotification('Please enter your name first', 'error');
        return;
    }

    try {
        const response = await joinRoom(room.roomId, playerName);
        console.log('Joined room from list:', response);

        // Update UI based on game state
        if (response.gameState.gameStarted) {
            showScreen('gameScreen');
            updateGameState(response.gameState);

            if (response.isSpectator) {
                document.getElementById('spectatorBadge').style.display = 'flex';
                const rollBtn = document.getElementById('centralRollBtn');
                if (rollBtn) {
                    rollBtn.disabled = true;
                    rollBtn.textContent = 'Spectating';
                }
            }
        } else {
            document.getElementById('roomCodeDisplay').textContent = response.roomId;
            updateLobbyPlayers(response.gameState);
            showScreen('lobbyScreen');
        }

        showNotification(response.isSpectator ? 'Spectating game... 👁️' : 'Joined room successfully! 🎉');
    } catch (error) {
        console.error('Error joining room:', error);
        showNotification(error || 'Failed to join room', 'error');
    }
}

/**
 * Update rooms list (called when receiving roomsListUpdate event)
 */
function updateRoomsList(rooms) {
    displayRoomsList(rooms);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show modal
 */
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

/**
 * Hide modal
 */
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

/**
 * Load debug game state (for testing)
 */
function loadDebugGameState() {
    console.log('🔧 DEBUG MODE: Loading mock game state');

    // Set mock player data
    window.currentPlayerId = 'debug-player-1';
    window.currentRoomId = 'debug-room';
    window.currentPlayerName = 'Debug Player';
    window.isSpectator = false;

    // Create mock game state
    const mockGameState = {
        roomId: 'debug-room',
        players: [
            {
                id: 'debug-player-1',
                name: 'Red Player',
                color: 'red',
                tokens: [
                    { id: 0, position: 0, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 1, position: 5, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 2, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 3, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'debug-player-3',
                name: 'Green Player',
                color: 'green',
                tokens: [
                    { id: 0, position: 26, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 1, position: 10, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 2, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 3, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'debug-player-4',
                name: 'Yellow Player',
                color: 'yellow',
                tokens: [
                    { id: 0, position: 39, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 1, position: 23, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 2, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 3, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'debug-player-2',
                name: 'Blue Player',
                color: 'blue',
                tokens: [
                    { id: 0, position: 0, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 1, position: 36, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 2, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 3, position: -1, inHomeStretch: false, homeStretchPosition: -1, finished: false }
                ],
                finishedTokens: 0
            }
        ],
        currentPlayerIndex: 0,
        gameStarted: true,
        gameOver: false,
        lastDiceRoll: null
    };

    mockGameState.currentPlayer = mockGameState.players[0];

    // Show game screen
    showScreen('gameScreen');

    // Update game state
    updateGameState(mockGameState);

    // Enable central roll dice button
    document.getElementById('centralRollBtn').disabled = false;

    console.log('✅ Debug game loaded - Board should be visible with position numbers');
}

// ==================== Event Handlers ====================

/**
 * Handle create room
 */
async function handleCreateRoom() {
    const playerName = document.getElementById('playerNameInput').value.trim();

    if (!playerName) {
        showNotification('Please enter your name', 'error');
        return;
    }

    const teamMode = document.getElementById('teamModeToggle').checked;

    try {
        const response = await createRoom(playerName, teamMode);
        console.log('Room created:', response);

        // Update UI
        document.getElementById('roomCodeDisplay').textContent = response.roomId;
        updateLobbyPlayers(response.gameState);
        showScreen('lobbyScreen');
        showNotification('Room created successfully! 🎉');
    } catch (error) {
        console.error('Error creating room:', error);
        showNotification(error || 'Failed to create room', 'error');
    }
}

/**
 * Handle join room
 */
async function handleJoinRoom() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    if (!playerName) {
        showNotification('Please enter your name', 'error');
        return;
    }

    if (!roomCode) {
        showNotification('Please enter a room code', 'error');
        return;
    }

    try {
        const response = await joinRoom(roomCode, playerName);
        console.log('Joined room via code:', response);

        // Update UI
        const joinModal = document.getElementById('joinRoomModal');
        if (joinModal) hideModal('joinRoomModal');

        if (response.gameState.gameStarted) {
            showScreen('gameScreen');
            updateGameState(response.gameState);

            if (response.isSpectator) {
                document.getElementById('spectatorBadge').style.display = 'flex';
                const rollBtn = document.getElementById('centralRollBtn');
                if (rollBtn) {
                    rollBtn.disabled = true;
                    rollBtn.textContent = 'Spectating';
                }
            }
        } else {
            document.getElementById('roomCodeDisplay').textContent = response.roomId;
            updateLobbyPlayers(response.gameState);
            showScreen('lobbyScreen');
        }

        showNotification(response.isSpectator ? 'Spectating game... 👁️' : 'Joined room successfully! 🎉');
    } catch (error) {
        console.error('Error joining room:', error);
        showNotification(error || 'Failed to join room', 'error');
    }
}

/**
 * Handle leave lobby
 */
function handleLeaveLobby() {
    if (window.clearSession) {
        clearSession();
    }
    location.reload();
}

/**
 * Handle start game
 */
async function handleStartGame() {
    try {
        await startGame();
        // Game started event will be received via socket
    } catch (error) {
        console.error('Error starting game:', error);
        showNotification(error || 'Failed to start game', 'error');
    }
}

/**
 * Handle copy room code
 */
function handleCopyRoomCode() {
    const roomCode = document.getElementById('roomCodeDisplay').textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(roomCode).then(() => {
            showNotification('Room code copied! 📋');
        }).catch(() => {
            showNotification('Failed to copy room code', 'error');
        });
    } else {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = roomCode;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showNotification('Room code copied! 📋');
    }
}

/**
 * Handle leave game
 */
function handleLeaveGame() {
    if (confirm('Are you sure you want to leave the game?')) {
        // Explicitly tell server we are leaving
        if (window.socket && window.socket.connected) {
            window.socket.emit('leaveRoom', () => {
                cleanupAndLeave();
            });

            // Fallback in case server doesn't respond
            setTimeout(cleanupAndLeave, 1000);
        } else {
            cleanupAndLeave();
        }
    }
}

function cleanupAndLeave() {
    if (window.clearSession) {
        clearSession();
    }
    location.reload();
}

/**
 * Handle roll dice
 */
async function handleRollDice() {
    try {
        const rollBtn = document.getElementById('centralRollBtn');
        if (rollBtn) rollBtn.disabled = true;
        await rollDice();
        // Dice rolled event will be received via socket
    } catch (error) {
        console.error('Error rolling dice:', error);
        showNotification(error || 'Failed to roll dice', 'error');
        const rollBtn = document.getElementById('centralRollBtn');
        if (rollBtn) rollBtn.disabled = false;
    }
}

/**
 * Handle send chat
 */
async function handleSendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    try {
        await sendChatMessage(message);
        input.value = '';
    } catch (error) {
        console.error('Error sending chat:', error);
        showNotification('Failed to send message', 'error');
    }
}

/**
 * Handle send emoji
 */
async function handleSendEmoji(emoji) {
    try {
        await sendEmoji(emoji);
    } catch (error) {
        console.error('Error sending emoji:', error);
    }
}

/**
 * Handle board click (for token selection)
 */
function handleBoardClick(event) {
    // This will be implemented in game.js
    if (window.handleTokenClick) {
        window.handleTokenClick(event);
    }
}

// ==================== UI Updates ====================

/**
 * Update lobby players list
 */
function updateLobbyPlayers(gameState) {
    const playersList = document.getElementById('playersList');
    const playerCount = document.getElementById('playerCount');
    const startGameBtn = document.getElementById('startGameBtn');

    playerCount.textContent = gameState.players.length;

    // Show/hide team mode badge
    const teamModeBadge = document.getElementById('lobbyTeamModeBadge');
    if (teamModeBadge) {
        teamModeBadge.style.display = gameState.teamMode ? 'inline-block' : 'none';
    }

    playersList.innerHTML = '';

    gameState.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';

        playerCard.innerHTML = `
      <div class="player-avatar ${player.color}">
        ${player.name.charAt(0).toUpperCase()}
      </div>
      <div class="player-info">
        <div class="player-name">${player.name}</div>
        <div class="player-status">${player.color.charAt(0).toUpperCase() + player.color.slice(1)} Player</div>
      </div>
    `;

        playersList.appendChild(playerCard);
    });

    // Enable start button if we have at least 2 players
    startGameBtn.disabled = gameState.players.length < 2;
}

/**
 * Update game players list
 */
function updateGamePlayers(gameState) {
    const gamePlayersList = document.getElementById('gamePlayers');

    if (!gamePlayersList) return;

    gamePlayersList.innerHTML = '';

    gameState.players.forEach((player, index) => {
        const isCurrentPlayer = index === gameState.currentPlayerIndex;
        const isOffline = player.online === false;
        const playerIdentifier = (player.id && player.id.includes('@')) ? player.id : '';

        const playerItem = document.createElement('div');
        playerItem.className = `game-player-item ${isCurrentPlayer ? 'active' : ''} ${isOffline ? 'offline' : ''}`;
        playerItem.dataset.playerId = player.id;

        playerItem.innerHTML = `
      <div class="player-color-dot ${player.color}"></div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.875rem;">
            ${player.name} ${isOffline ? '(Offline)' : ''} 
            ${player.id === window.currentPlayerId ? '<span style="color: var(--primary-light); font-size: 0.7rem; font-weight: normal; margin-left: 4px;">(You)</span>' : ''}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          ${player.finishedTokens}/4 finished
        </div>
      </div>
      ${isCurrentPlayer ? '<span style="font-size: 0.75rem;">🎯</span>' : ''}
    `;

        gamePlayersList.appendChild(playerItem);
    });
}

/**
 * Update a specific player's online status in the UI
 */
function updatePlayerOnlineStatus(playerId, isOnline) {
    const playerItem = document.querySelector(`.game-player-item[data-player-id="${playerId}"]`);
    if (playerItem) {
        if (isOnline) {
            playerItem.classList.remove('offline');
        } else {
            playerItem.classList.add('offline');
        }

        // Find the name container and update the offline text without destroying other spans
        const nameEl = playerItem.querySelector('div[style*="font-weight: 600"]');
        if (nameEl) {
            // Remove any existing "(Offline)" text
            let content = nameEl.innerHTML.replace(/\s*\(Offline\)\s*/g, '');
            if (!isOnline) {
                // Add it back at the end of the name if offline
                content = content.replace(/([^<]+)/, `$1 (Offline)`);
            }
            nameEl.innerHTML = content;
        }
    }
}

/**
 * Update game state
 */
function updateGameState(gameState) {
    // Update current player indicator in header
    const currentPlayer = gameState.currentPlayer;
    const currentPlayerName = document.getElementById('currentPlayerName');
    const currentPlayerIndicator = document.getElementById('currentPlayerIndicator');

    if (currentPlayer) {
        currentPlayerName.textContent = `${currentPlayer.name}'s Turn`;
        currentPlayerIndicator.style.background = `var(--color-${currentPlayer.color})`;
    }

    // Show/hide team mode badge
    const teamModeBadge = document.getElementById('gameTeamModeBadge');
    if (teamModeBadge) {
        teamModeBadge.style.display = gameState.teamMode ? 'inline-block' : 'none';
    }

    // Update player dice displays
    updatePlayerDice(gameState);

    // Update players list
    updateGamePlayers(gameState);

    // Render game board
    if (window.renderGameBoard) {
        window.renderGameBoard(gameState);
    }
}

/**
 * Update central dice and timer based on current turn
 */
function updatePlayerDice(gameState) {
    const rollBtn = document.getElementById('centralRollBtn');
    const diceValue = document.getElementById('centralDiceValue');
    const diceDisplay = document.querySelector('.dice-display');

    if (!rollBtn) return;

    // Check if it's our turn
    const isOurTurn = gameState.currentPlayer && String(gameState.currentPlayer.id) === String(window.currentPlayerId);
    const hasRolled = gameState.lastDiceRoll !== null && gameState.lastDiceRoll !== undefined;

    if (DEBUG_MODE) {
        console.log(`[DICE] OurTurn: ${isOurTurn}, HasRolled: ${hasRolled}, Spectator: ${window.isSpectator}`);
        console.log(`[DICE] Current Player ID: ${gameState.currentPlayer?.id}, Local Player ID: ${window.currentPlayerId}`);
    }

    // Update dice display
    if (diceValue) {
        if (gameState.lastDiceRoll) {
            diceValue.textContent = gameState.lastDiceRoll;
        } else {
            diceValue.textContent = '?';
        }
    }

    // Update button state (only active for current player and if not rolled yet)
    // IMPORTANT: Ensure window.isSpectator is treated as a boolean
    const isSpectating = window.isSpectator === true || window.isSpectator === 'true';
    rollBtn.disabled = !isOurTurn || hasRolled || isSpectating;

    // Update button text if spectating
    if (isSpectating) {
        rollBtn.textContent = 'Spectating';
    } else {
        rollBtn.textContent = '🎲 Roll Dice';
    }

    // Update button color/feel based on current player
    if (gameState.currentPlayer) {
        rollBtn.style.background = `var(--color-${gameState.currentPlayer.color})`;
        if (diceDisplay) {
            diceDisplay.style.borderColor = `var(--color-${gameState.currentPlayer.color})`;
        }
    }
}

/**
 * Add chat message
 */
function addChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const timestamp = new Date(data.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
    <div class="chat-message-header">
      <div class="player-color-dot ${data.playerColor}"></div>
      <span class="chat-player-name">${data.playerName}</span>
      <span class="chat-timestamp">${timestamp}</span>
    </div>
    <div class="chat-message-text">${data.message}</div>
  `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show emoji animation
 */
function showEmojiAnimation(emoji, playerName = '') {
    const container = document.getElementById('emojiAnimations');

    const wrapper = document.createElement('div');
    wrapper.className = 'emoji-float-container';

    const emojiElement = document.createElement('div');
    emojiElement.className = 'emoji-float';
    emojiElement.textContent = emoji;

    wrapper.appendChild(emojiElement);

    if (playerName) {
        const nameElement = document.createElement('div');
        nameElement.className = 'emoji-float-name';
        nameElement.textContent = playerName;
        wrapper.appendChild(nameElement);
    }

    // Random position
    wrapper.style.left = `${Math.random() * 80 + 10}%`;
    wrapper.style.top = '80%';

    container.appendChild(wrapper);

    // Remove after animation
    setTimeout(() => {
        wrapper.remove();
    }, 3000);
}

/**
 * Show a small chat popup near the chat button
 */
function showChatPopup(data) {
    const chatBtn = document.getElementById('chatBtn');
    if (!chatBtn || document.getElementById('chatModal').classList.contains('active')) return;

    // Remove existing popups if any
    const existingPopup = document.querySelector('.chat-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.className = 'chat-popup';

    popup.innerHTML = `
        <span class="chat-popup-name">${data.playerName}</span>
        <span class="chat-popup-msg">${data.message}</span>
    `;

    // Position it relative to the chat button
    const floatingButtons = document.querySelector('.floating-buttons');
    floatingButtons.appendChild(popup);

    // Position it specifically next to the chat button inside the flex container
    // The chat-popup has absolute positioning so it will be relative to .floating-buttons
    // Since #chatBtn is likely the first child (if it's the top one), we might need to adjust
    // But CSS 'right: 75px' should place it to the left of the vertical column of FABs.

    // Remove after a few seconds
    setTimeout(() => {
        if (popup && popup.parentElement) {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(20px)';
            popup.style.transition = 'all 0.3s ease';
            setTimeout(() => popup.remove(), 300);
        }
    }, 4000);
}

/**
 * Show game over modal
 */
function showGameOverModal(winner) {
    const modal = document.getElementById('gameOverModal');
    const winnerAvatar = document.getElementById('winnerAvatar');
    const winnerName = document.getElementById('winnerName');

    winnerAvatar.className = `winner-avatar player-avatar ${winner.color}`;
    winnerAvatar.textContent = winner.name.charAt(0).toUpperCase();
    winnerName.textContent = winner.name;

    showModal('gameOverModal');
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
