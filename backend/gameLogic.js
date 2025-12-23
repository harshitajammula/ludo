/**
 * Core Ludo Game Logic
 * Handles all game rules, token movement, and win conditions
 */

class LudoGame {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.winner = null;
        this.lastDiceRoll = null;
        this.consecutiveSixes = 0;

        // Board configuration
        this.BOARD_SIZE = 52; // Main path squares (0-51)
        this.TOKENS_PER_PLAYER = 4;
        this.HOME_STRETCH_LENGTH = 5; // Safe zone squares (5 per player)

        // Safe positions on the board (where tokens can't be captured) - Star positions
        this.SAFE_POSITIONS = [0, 13, 21, 26, 34, 39, 47];

        // Starting positions for each color
        this.START_POSITIONS = {
            red: 0,      // Pink player
            green: 13,   // Green player - corrected
            yellow: 27,
            blue: 40
        };

        // Home entrance positions (position before entering home stretch)
        this.HOME_ENTRANCE = {
            red: 51,     // After 51, enters home stretch at 52
            green: 12,   // After 12, enters home stretch at 57
            yellow: 26,  // After 26, enters home stretch at 63
            blue: 39     // After 39, enters home stretch at 68
        };
    }

    /**
     * Add a player to the game
     */
    addPlayer(playerId, playerName) {
        if (this.players.length >= 4) {
            return { success: false, error: 'Game is full' };
        }

        if (this.gameStarted) {
            return { success: false, error: 'Game already started' };
        }

        // For 2 players, assign diagonal colors (Red & Green) for fairness
        const colors = ['red', 'blue', 'green', 'yellow'];
        const takenColors = this.players.map(p => p.color);

        let availableColor;
        if (this.players.length === 0) {
            // First player gets red
            availableColor = 'red';
        } else if (this.players.length === 1 && !takenColors.includes('green')) {
            // Second player gets green (diagonal to red)
            availableColor = 'green';
        } else {
            // Third and fourth players get remaining colors
            availableColor = colors.find(c => !takenColors.includes(c));
        }

        const player = {
            id: playerId,
            name: playerName,
            color: availableColor,
            tokens: this.initializeTokens(availableColor),
            finishedTokens: 0
        };

        this.players.push(player);

        return { success: true, player };
    }

    /**
     * Initialize tokens for a player
     */
    initializeTokens(color) {
        const tokens = [];
        for (let i = 0; i < this.TOKENS_PER_PLAYER; i++) {
            tokens.push({
                id: i,
                position: -1, // -1 means in starting area
                inHomeStretch: false,
                homeStretchPosition: -1,
                finished: false
            });
        }
        return tokens;
    }

    /**
     * Remove a player from the game
     */
    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);

            // Adjust current player index if needed
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }

            return true;
        }
        return false;
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.players.length < 2) {
            return { success: false, error: 'Need at least 2 players to start' };
        }

        this.gameStarted = true;
        this.currentPlayerIndex = 0;

        return { success: true };
    }

    /**
     * Roll the dice
     */
    rollDice(playerId) {
        if (!this.gameStarted || this.gameOver) {
            return { success: false, error: 'Game not in progress' };
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const diceValue = Math.floor(Math.random() * 6) + 1;
        this.lastDiceRoll = diceValue;

        // Track consecutive sixes (optional rule: 3 sixes in a row = lose turn)
        if (diceValue === 6) {
            this.consecutiveSixes++;
        } else {
            this.consecutiveSixes = 0;
        }

        const canMove = this.getMovableTokens(currentPlayer, diceValue).length > 0;

        // If player can't move, automatically pass turn
        let turnSkipped = false;
        if (!canMove) {
            this.lastDiceRoll = null;
            this.nextTurn();
            turnSkipped = true;
        }

        return {
            success: true,
            diceValue,
            canMove,
            turnSkipped
        };
    }

    /**
     * Get tokens that can be moved with the current dice roll
     */
    getMovableTokens(player, diceValue) {
        const movableTokens = [];

        for (let i = 0; i < player.tokens.length; i++) {
            const token = player.tokens[i];

            // Token in starting area - can only move with a 6
            if (token.position === -1) {
                if (diceValue === 6) {
                    movableTokens.push(i);
                }
                continue;
            }

            // Token finished - can't move
            if (token.finished) {
                continue;
            }

            // Token in home stretch
            if (token.inHomeStretch) {
                if (token.homeStretchPosition + diceValue <= this.HOME_STRETCH_LENGTH) {
                    movableTokens.push(i);
                }
                continue;
            }

            // Token on main board - can always move
            movableTokens.push(i);
        }

        return movableTokens;
    }

    /**
     * Move a token
     */
    moveToken(playerId, tokenIndex) {
        if (!this.gameStarted || this.gameOver) {
            return { success: false, error: 'Game not in progress' };
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        if (!this.lastDiceRoll) {
            return { success: false, error: 'Roll dice first' };
        }

        const token = currentPlayer.tokens[tokenIndex];
        const diceValue = this.lastDiceRoll;
        const movableTokens = this.getMovableTokens(currentPlayer, diceValue);

        if (!movableTokens.includes(tokenIndex)) {
            return { success: false, error: 'Cannot move this token' };
        }

        let captured = null;

        // Move token from starting area
        if (token.position === -1) {
            token.position = this.START_POSITIONS[currentPlayer.color];
        }
        // Move token in home stretch
        else if (token.inHomeStretch) {
            token.homeStretchPosition += diceValue;
            if (token.homeStretchPosition === this.HOME_STRETCH_LENGTH) {
                token.finished = true;
                currentPlayer.finishedTokens++;
            }
        }
        // Move token on main board
        else {
            const newPosition = (token.position + diceValue) % this.BOARD_SIZE;

            // Check if entering home stretch
            const homeEntrance = this.HOME_ENTRANCE[currentPlayer.color];
            if (this.willEnterHomeStretch(token.position, diceValue, homeEntrance)) {
                token.inHomeStretch = true;
                const stepsIntoHome = this.calculateHomeStretchSteps(token.position, diceValue, homeEntrance);
                token.homeStretchPosition = stepsIntoHome;

                if (token.homeStretchPosition === this.HOME_STRETCH_LENGTH) {
                    token.finished = true;
                    currentPlayer.finishedTokens++;
                }
            } else {
                token.position = newPosition;

                // Check for captures
                captured = this.checkCapture(currentPlayer, token.position);
            }
        }

        // Check for win
        if (currentPlayer.finishedTokens === this.TOKENS_PER_PLAYER) {
            this.gameOver = true;
            this.winner = currentPlayer;
        }

        // Determine if player gets another turn (rolled a 6 OR captured a token)
        const anotherTurn = (diceValue === 6 || captured !== null) && !this.gameOver;

        if (!anotherTurn) {
            this.nextTurn();
        }

        this.lastDiceRoll = null; // Reset dice roll

        return {
            success: true,
            token: { ...token, index: tokenIndex },
            captured,
            anotherTurn,
            gameOver: this.gameOver,
            winner: this.winner
        };
    }

    /**
     * Check if token will enter home stretch
     * Token enters home stretch when it lands on or passes the home entrance position
     */
    willEnterHomeStretch(currentPos, diceValue, homeEntrance) {
        // Check each step of the move
        for (let i = 1; i <= diceValue; i++) {
            const nextPos = (currentPos + i) % this.BOARD_SIZE;

            // If we land exactly on the home entrance, we enter
            if (nextPos === homeEntrance) {
                return true;
            }

            // If we pass through the home entrance
            // Need to handle wrap-around carefully
            if (currentPos < homeEntrance) {
                // Normal case: moving forward without wrap
                if (nextPos > currentPos && nextPos >= homeEntrance) {
                    return true;
                }
            } else {
                // Wrap-around case: currentPos > homeEntrance
                // We enter if we've wrapped around and reached/passed entrance
                if (nextPos < currentPos && nextPos >= homeEntrance) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Calculate how many steps into home stretch
     * Returns how far into the home stretch the token should be
     */
    calculateHomeStretchSteps(currentPos, diceValue, homeEntrance) {
        // Find how many steps it takes to reach the home entrance
        for (let i = 1; i <= diceValue; i++) {
            const nextPos = (currentPos + i) % this.BOARD_SIZE;

            // If we land on or pass the home entrance
            if (nextPos === homeEntrance ||
                (currentPos < homeEntrance && nextPos >= homeEntrance) ||
                (currentPos > homeEntrance && nextPos < currentPos && nextPos >= homeEntrance)) {
                // Remaining steps go into home stretch
                return diceValue - i;
            }
        }

        return 0;
    }

    /**
     * Check if a token captures another player's token
     */
    checkCapture(currentPlayer, position) {
        // Can't capture on safe positions
        if (this.SAFE_POSITIONS.includes(position)) {
            return null;
        }

        for (let player of this.players) {
            if (player.id === currentPlayer.id) continue;

            for (let i = 0; i < player.tokens.length; i++) {
                const token = player.tokens[i];
                if (token.position === position && !token.inHomeStretch && !token.finished) {
                    // Capture! Send token back to start
                    token.position = -1;
                    return {
                        playerId: player.id,
                        playerName: player.name,
                        playerColor: player.color,
                        tokenIndex: i
                    };
                }
            }
        }

        return null;
    }

    /**
     * Move to next player's turn
     */
    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.consecutiveSixes = 0;
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                color: p.color,
                tokens: p.tokens,
                finishedTokens: p.finishedTokens
            })),
            currentPlayerIndex: this.currentPlayerIndex,
            currentPlayer: this.players[this.currentPlayerIndex],
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            winner: this.winner,
            lastDiceRoll: this.lastDiceRoll
        };
    }
}

module.exports = LudoGame;
