/**
 * UI Management
 * Handles all UI interactions and updates
 */

// DEBUG MODE - Set to false for production
const DEBUG_MODE = false;

/**
 * Initialize the application
 */
function initializeApp() {
    initializeSocket();
    setupEventListeners();

    // Debug mode: Skip directly to game screen
    if (DEBUG_MODE) {
        loadDebugGameState();
    } else {
        showScreen('welcomeScreen');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Welcome screen
    document.getElementById('createRoomBtn').addEventListener('click', handleCreateRoom);
    document.getElementById('joinRoomBtn').addEventListener('click', () => {
        const playerName = document.getElementById('playerNameInput').value.trim();
        if (!playerName) {
            showNotification('Please enter your name', 'error');
            return;
        }
        showModal('joinRoomModal');
    });

    // Join room modal
    document.getElementById('closeJoinModal').addEventListener('click', () => {
        hideModal('joinRoomModal');
    });
    document.getElementById('confirmJoinBtn').addEventListener('click', handleJoinRoom);

    // Allow Enter key in room code input
    document.getElementById('roomCodeInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleJoinRoom();
        }
    });

    // Lobby screen
    document.getElementById('leaveLobbyBtn').addEventListener('click', handleLeaveLobby);
    document.getElementById('startGameBtn').addEventListener('click', handleStartGame);
    document.getElementById('copyRoomCodeBtn').addEventListener('click', handleCopyRoomCode);

    // Game screen
    document.getElementById('leaveGameBtn').addEventListener('click', handleLeaveGame);
    document.getElementById('rollDiceBtn').addEventListener('click', handleRollDice);

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
                id: 'debug-player-2',
                name: 'Blue Player',
                color: 'blue',
                tokens: [
                    { id: 0, position: 13, inHomeStretch: false, homeStretchPosition: -1, finished: false },
                    { id: 1, position: 20, inHomeStretch: false, homeStretchPosition: -1, finished: false },
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

    // Enable roll dice button
    document.getElementById('rollDiceBtn').disabled = false;

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

    try {
        const response = await createRoom(playerName);
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
        console.log('Joined room:', response);

        // Update UI
        hideModal('joinRoomModal');
        document.getElementById('roomCodeDisplay').textContent = response.roomId;
        updateLobbyPlayers(response.gameState);
        showScreen('lobbyScreen');
        showNotification('Joined room successfully! 🎉');
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
        if (window.clearSession) {
            clearSession();
        }
        location.reload();
    }
}

/**
 * Handle roll dice
 */
async function handleRollDice() {
    try {
        document.getElementById('rollDiceBtn').disabled = true;
        await rollDice();
        // Dice rolled event will be received via socket
    } catch (error) {
        console.error('Error rolling dice:', error);
        showNotification(error || 'Failed to roll dice', 'error');
        document.getElementById('rollDiceBtn').disabled = false;
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
        <div class="player-status">${player.color}</div>
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

        const playerItem = document.createElement('div');
        playerItem.className = `game-player-item ${isCurrentPlayer ? 'active' : ''}`;

        playerItem.innerHTML = `
      <div class="player-color-dot ${player.color}"></div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.875rem;">${player.name}</div>
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
 * Update game state
 */
function updateGameState(gameState) {
    // Update current player indicator
    const currentPlayer = gameState.currentPlayer;
    const currentPlayerName = document.getElementById('currentPlayerName');
    const currentPlayerIndicator = document.getElementById('currentPlayerIndicator');
    const rollDiceBtn = document.getElementById('rollDiceBtn');

    if (currentPlayer) {
        currentPlayerName.textContent = `${currentPlayer.name}'s Turn`;
        currentPlayerIndicator.style.background = `var(--color-${currentPlayer.color})`;

        // Enable roll button only if it's the current player's turn and they haven't rolled yet
        const isMyTurn = currentPlayer.id === currentPlayerId;
        const hasRolled = gameState.lastDiceRoll !== null;
        rollDiceBtn.disabled = !isMyTurn || hasRolled;
    }

    // Update players list
    updateGamePlayers(gameState);

    // Render game board
    if (window.renderGameBoard) {
        window.renderGameBoard(gameState);
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
function showEmojiAnimation(emoji) {
    const container = document.getElementById('emojiAnimations');

    const emojiElement = document.createElement('div');
    emojiElement.className = 'emoji-float';
    emojiElement.textContent = emoji;

    // Random position
    emojiElement.style.left = `${Math.random() * 80 + 10}%`;
    emojiElement.style.top = '80%';

    container.appendChild(emojiElement);

    // Remove after animation
    setTimeout(() => {
        emojiElement.remove();
    }, 3000);
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
