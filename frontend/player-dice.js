/**
 * UI Management - Player Dice System
 * Handles individual dice for each player
 */

// Initialize player dice buttons
function setupPlayerDiceButtons() {
    const diceButtons = document.querySelectorAll('.roll-dice-btn');

    diceButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const playerColor = btn.dataset.player;
            await handleRollDice();
        });
    });
}

/**
 * Update player dice displays
 */
function updatePlayerDice(gameState) {
    const players = gameState.players;

    // Update each player's dice section
    players.forEach(player => {
        const diceSection = document.querySelector(`.${player.color}-dice`);
        if (!diceSection) return;

        const nameLabel = diceSection.querySelector('.player-name-label');
        const diceDisplay = diceSection.querySelector('.dice-display');
        const rollBtn = diceSection.querySelector('.roll-dice-btn');
        const diceValue = diceDisplay?.querySelector('.dice-value');

        // Update player name
        if (nameLabel) {
            nameLabel.textContent = player.name;
        }

        // Check if it's this player's turn
        const isCurrentPlayer = gameState.currentPlayer && gameState.currentPlayer.id === player.id;
        const isMyTurn = player.id === currentPlayerId;

        // Add/remove active class for blinking effect
        if (isCurrentPlayer) {
            diceSection.classList.add('active');
        } else {
            diceSection.classList.remove('active');
        }

        // Update dice value
        if (diceValue) {
            if (isCurrentPlayer && gameState.lastDiceRoll) {
                diceValue.textContent = gameState.lastDiceRoll;
            } else {
                diceValue.textContent = '?';
            }
        }

        // Enable/disable roll button
        if (rollBtn) {
            const hasRolled = gameState.lastDiceRoll !== null;
            rollBtn.disabled = !isMyTurn || !isCurrentPlayer || hasRolled;
        }
    });
}

/**
 * Animate dice roll for specific player
 */
function animateDiceRoll(playerColor, value) {
    const diceSection = document.querySelector(`.${playerColor}-dice`);
    if (!diceSection) return;

    const diceDisplay = diceSection.querySelector('.dice-display');
    const diceValue = diceDisplay.querySelector('.dice-value');

    // Add rolling animation
    diceDisplay.classList.add('rolling');

    // Show random numbers during roll
    let rollCount = 0;
    const rollInterval = setInterval(() => {
        diceValue.textContent = Math.floor(Math.random() * 6) + 1;
        rollCount++;

        if (rollCount >= 8) {
            clearInterval(rollInterval);
            diceValue.textContent = value;
            diceDisplay.classList.remove('rolling');
        }
    }, 60);
}

// Export functions
window.setupPlayerDiceButtons = setupPlayerDiceButtons;
window.updatePlayerDice = updatePlayerDice;
window.animateDiceRoll = animateDiceRoll;
