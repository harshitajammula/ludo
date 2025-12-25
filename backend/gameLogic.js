/**
 * Core Ludo Game Logic
 * Handles all game rules, token movement, and win conditions
 */

class LudoGame {
    constructor(roomId, teamMode = false) {
        this.roomId = roomId;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.gameStarted = false;
        this.gameOver = false;
        this.winner = null;
        this.lastDiceRoll = null;
        this.consecutiveSixes = 0;

        // Timer system
        this.turnTimeLimit = 30; // 30 seconds per turn
        this.turnStartTime = null;
        this.playerMissedTurns = {}; // Track missed turns per player
        this.eliminatedPlayers = []; // Players eliminated after 3 missed turns

        // Team play system
        this.teamMode = teamMode;
        this.teams = teamMode ? {
            team1: [], // Will be populated with player colors
            team2: []
        } : null;
        this.finishedPlayers = []; // Players who completed all tokens
        this.activeControllers = {}; // Maps color -> playerId controlling it

        // Board configuration
        this.BOARD_SIZE = 52; // Main path squares (0-51)
        this.TOKENS_PER_PLAYER = 4;
        this.HOME_STRETCH_LENGTH = 5; // Safe zone squares (5 per player)

        // Safe positions on the board (where tokens can't be captured) - Star positions
        // Stars at starting positions (0,13,26,39) + middle positions (8,21,34,47)
        this.SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

        // Starting positions for each color
        this.START_POSITIONS = {
            red: 0,
            green: 13,
            yellow: 26,
            blue: 39
        };

        // Home entrance positions (position before entering home stretch)
        this.HOME_ENTRANCE = {
            red: 50,
            green: 11,
            yellow: 24,
            blue: 37
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

        // For 2 players, assign diagonal colors (Red & Yellow) for fairness
        const colors = ['red', 'yellow', 'blue', 'green'];
        const takenColors = this.players.map(p => p.color);

        let availableColor;
        if (this.players.length === 0) {
            // First player gets red
            availableColor = 'red';
        } else if (this.players.length === 1 && !takenColors.includes('yellow')) {
            // Second player gets yellow (diagonal to red)
            availableColor = 'yellow';
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

    startGame() {
        if (this.players.length < 2) {
            return { success: false, error: 'Need at least 2 players to start' };
        }

        this.gameStarted = true;
        this.currentPlayerIndex = 0;

        if (this.teamMode) {
            this.initializeTeams();
        }

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

        // Determine which player's tokens we are checking
        let targetPlayer = player;

        // In team mode, if player is finished, they move teammate's tokens
        if (this.teamMode && this.isPlayerFinished(player.id)) {
            const teammateColor = this.getTeammateColor(player.color);
            targetPlayer = this.players.find(p => p.color === teammateColor) || player;
        }

        // Only allow moving tokens if the target player is not finished
        if (!this.isPlayerFinished(targetPlayer.id)) {
            for (let i = 0; i < targetPlayer.tokens.length; i++) {
                const token = targetPlayer.tokens[i];

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
        }

        return movableTokens;
    }

    /**
     * Move a token
     */
    moveToken(playerId, tokenIndex, autoPlay = false) {
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

        // Determine which player's token is being moved
        let movingPlayer = currentPlayer;
        if (this.teamMode && this.isPlayerFinished(currentPlayer.id)) {
            const teammateColor = this.getTeammateColor(currentPlayer.color);
            movingPlayer = this.players.find(p => p.color === teammateColor) || currentPlayer;
        }

        const token = movingPlayer.tokens[tokenIndex];
        const diceValue = this.lastDiceRoll;
        const movableTokens = this.getMovableTokens(currentPlayer, diceValue);

        if (!movableTokens.includes(tokenIndex)) {
            return { success: false, error: 'Cannot move this token' };
        }

        let captured = null;

        // Move token from starting area
        if (token.position === -1) {
            token.position = this.START_POSITIONS[movingPlayer.color];
        }
        // Move token in home stretch
        else if (token.inHomeStretch) {
            token.homeStretchPosition += diceValue;
            if (token.homeStretchPosition === this.HOME_STRETCH_LENGTH) {
                token.finished = true;
                movingPlayer.finishedTokens++;
            }
        }
        // Move token on main board
        else {
            const newPosition = (token.position + diceValue) % this.BOARD_SIZE;

            // Check if entering home stretch
            const homeEntrance = this.HOME_ENTRANCE[movingPlayer.color];
            if (this.willEnterHomeStretch(token.position, diceValue, homeEntrance)) {
                token.inHomeStretch = true;
                const stepsIntoHome = this.calculateHomeStretchSteps(token.position, diceValue, homeEntrance);
                token.homeStretchPosition = stepsIntoHome;

                if (token.homeStretchPosition === this.HOME_STRETCH_LENGTH) {
                    token.finished = true;
                    movingPlayer.finishedTokens++;
                }
            } else {
                token.position = newPosition;

                // Check for captures
                captured = this.checkCapture(movingPlayer, token.position);
            }
        }

        // Check if players finished
        if (movingPlayer.finishedTokens === this.TOKENS_PER_PLAYER) {
            this.markPlayerFinished(movingPlayer.id);
        }

        // Check for win (solo mode) or team victory (team mode)
        let teamVictory = null;
        if (this.teamMode) {
            teamVictory = this.checkTeamVictory();
            if (teamVictory) {
                this.gameOver = true;
                this.winner = teamVictory;
            }
        } else if (currentPlayer.finishedTokens === this.TOKENS_PER_PLAYER) {
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
            token: { ...token, index: tokenIndex, playerColor: movingPlayer.color },
            captured,
            anotherTurn,
            gameOver: this.gameOver,
            winner: this.winner,
            autoPlay,
            playerFinished: movingPlayer.finishedTokens === this.TOKENS_PER_PLAYER,
            teamVictory
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
     * Check if a token captures another player's tokens
     */
    checkCapture(currentPlayer, position) {
        // Can't capture on safe positions
        if (this.SAFE_POSITIONS.includes(position)) {
            return null;
        }

        const capturedList = [];
        const teammateColor = this.getTeammateColor(currentPlayer.color);

        for (let player of this.players) {
            // Can't capture own tokens
            if (player.id === currentPlayer.id) continue;

            // In team mode, can't capture teammate's tokens
            if (this.teamMode && player.color === teammateColor) continue;

            for (let i = 0; i < player.tokens.length; i++) {
                const token = player.tokens[i];
                if (token.position === position && !token.inHomeStretch && !token.finished) {
                    // Capture! Send token back to start
                    token.position = -1;
                    capturedList.push({
                        playerId: player.id,
                        playerName: player.name,
                        playerColor: player.color,
                        tokenIndex: i
                    });
                }
            }
        }

        return capturedList.length > 0 ? capturedList : null;
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
            lastDiceRoll: this.lastDiceRoll,
            teamMode: this.teamMode,
            teams: this.teams,
            eliminatedPlayers: this.eliminatedPlayers,
            finishedPlayers: this.finishedPlayers,
            playerMissedTurns: this.playerMissedTurns
        };
    }

    // ==================== Timer System Methods ====================

    /**
     * Start turn timer
     */
    startTurnTimer() {
        this.turnStartTime = Date.now();
    }

    /**
     * Get remaining time for current turn
     */
    getRemainingTime() {
        if (!this.turnStartTime) return this.turnTimeLimit;
        const elapsed = Math.floor((Date.now() - this.turnStartTime) / 1000);
        return Math.max(0, this.turnTimeLimit - elapsed);
    }

    /**
     * Reset missed turns for a player (called on manual action)
     */
    resetMissedTurns(playerId) {
        this.playerMissedTurns[playerId] = 0;
    }

    /**
     * Increment missed turns and check for elimination
     */
    incrementMissedTurns(playerId) {
        if (!this.playerMissedTurns[playerId]) {
            this.playerMissedTurns[playerId] = 0;
        }
        this.playerMissedTurns[playerId]++;

        // Eliminate player after 3 missed turns
        if (this.playerMissedTurns[playerId] >= 3) {
            this.eliminatePlayer(playerId);
            return true; // Player eliminated
        }
        return false; // Not eliminated yet
    }

    /**
     * Eliminate a player from the game
     */
    eliminatePlayer(playerId) {
        if (!this.eliminatedPlayers.includes(playerId)) {
            this.eliminatedPlayers.push(playerId);
        }
    }

    /**
     * Check if player is eliminated
     */
    isPlayerEliminated(playerId) {
        return this.eliminatedPlayers.includes(playerId);
    }

    /**
     * Auto-roll dice for inactive player
     */
    autoRollDice(playerId) {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        this.lastDiceRoll = diceValue;

        if (diceValue === 6) {
            this.consecutiveSixes++;
        } else {
            this.consecutiveSixes = 0;
        }

        const currentPlayer = this.players.find(p => p.id === playerId);
        const canMove = this.getMovableTokens(currentPlayer, diceValue).length > 0;

        return {
            success: true,
            diceValue,
            canMove,
            autoPlay: true
        };
    }

    /**
     * Auto-move token (selects token closest to home)
     */
    autoMoveToken(playerId) {
        const currentPlayer = this.players.find(p => p.id === playerId);
        if (!currentPlayer || !this.lastDiceRoll) {
            return { success: false, error: 'Cannot auto-move' };
        }

        const movableTokens = this.getMovableTokens(currentPlayer, this.lastDiceRoll);
        if (movableTokens.length === 0) {
            // No movable tokens, turn passes
            this.lastDiceRoll = null;
            this.nextTurn();
            return { success: true, noMove: true, autoPlay: true };
        }

        // Find token closest to home
        const tokenIndex = this.getTokenClosestToHome(currentPlayer, movableTokens);

        // Move the token
        return this.moveToken(playerId, tokenIndex, true); // true = autoPlay flag
    }

    /**
     * Get token closest to home from movable tokens
     */
    getTokenClosestToHome(player, movableTokenIndices) {
        let closestIndex = movableTokenIndices[0];
        let minDistanceToHome = Infinity;

        movableTokenIndices.forEach(index => {
            const token = player.tokens[index];
            const distance = this.calculateDistanceToHome(player.color, token);

            if (distance < minDistanceToHome) {
                minDistanceToHome = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    /**
     * Calculate distance from token to home
     */
    calculateDistanceToHome(color, token) {
        // If token is finished, distance is 0
        if (token.finished) return 0;

        // If token is in home stretch
        if (token.inHomeStretch) {
            return this.HOME_STRETCH_LENGTH - token.homeStretchPosition;
        }

        // If token is in starting area, distance is very large
        if (token.position === -1) {
            return 1000;
        }

        // Calculate distance on main board
        const homeEntrance = this.HOME_ENTRANCE[color];
        const currentPos = token.position;

        // Distance to home entrance + home stretch length
        let distance;
        if (currentPos <= homeEntrance) {
            distance = homeEntrance - currentPos + this.HOME_STRETCH_LENGTH;
        } else {
            // Need to wrap around
            distance = (this.BOARD_SIZE - currentPos) + homeEntrance + this.HOME_STRETCH_LENGTH;
        }

        return distance;
    }

    // ==================== Team Play Methods ====================

    /**
     * Initialize teams with default diagonal pairings
     */
    initializeTeams() {
        // Standard team assignment: Red & Yellow (diagonal) vs Blue & Green (diagonal)
        this.teams = {
            team1: ['red', 'yellow'],
            team2: ['blue', 'green']
        };
    }

    /**
     * Set team assignments manually
     */
    setTeams(team1Colors, team2Colors) {
        if (!this.teamMode) return;
        this.teams.team1 = team1Colors;
        this.teams.team2 = team2Colors;
    }

    /**
     * Get teammate color
     */
    getTeammateColor(color) {
        if (!this.teamMode) return null;

        if (this.teams.team1.includes(color)) {
            return this.teams.team1.find(c => c !== color);
        }
        if (this.teams.team2.includes(color)) {
            return this.teams.team2.find(c => c !== color);
        }
        return null;
    }

    /**
     * Check if player has finished all tokens
     */
    isPlayerFinished(playerId) {
        return this.finishedPlayers.includes(playerId);
    }

    /**
     * Mark player as finished
     */
    markPlayerFinished(playerId) {
        if (!this.finishedPlayers.includes(playerId)) {
            this.finishedPlayers.push(playerId);
        }
    }

    /**
     * Check if player can control a color (own or teammate's)
     */
    canPlayerControlColor(playerId, color) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return false;

        // Can always control own color
        if (player.color === color) return true;

        // In team mode, finished players can control teammate
        if (this.teamMode && this.isPlayerFinished(playerId)) {
            const teammateColor = this.getTeammateColor(player.color);
            return teammateColor === color;
        }

        return false;
    }

    /**
     * Check team victory
     */
    checkTeamVictory() {
        if (!this.teamMode) return null;

        // Check if all players in team1 have finished
        const team1Finished = this.teams.team1.every(color => {
            const player = this.players.find(p => p.color === color);
            return player && player.finishedTokens === this.TOKENS_PER_PLAYER;
        });

        if (team1Finished) {
            return { team: 'team1', players: this.teams.team1 };
        }

        // Check if all players in team2 have finished
        const team2Finished = this.teams.team2.every(color => {
            const player = this.players.find(p => p.color === color);
            return player && player.finishedTokens === this.TOKENS_PER_PLAYER;
        });

        if (team2Finished) {
            return { team: 'team2', players: this.teams.team2 };
        }

        return null;
    }
}

module.exports = LudoGame;
