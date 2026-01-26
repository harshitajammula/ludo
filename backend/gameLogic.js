/**
 * Core Ludo Game Logic
 * Handles all game rules, token movement, and win conditions
 */

const { v4: uuidv4 } = require('uuid');

class LudoGame {
    constructor(roomId, teamMode = false, creatorId = null) {
        this.roomId = roomId;
        this.creatorId = creatorId;
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
            finishedTokens: 0,
            online: true
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
     * Add a robot player to the game
     */
    addRobot() {
        if (this.players.length >= 4) {
            return { success: false, error: 'Game is full' };
        }

        if (this.gameStarted) {
            return { success: false, error: 'Game already started' };
        }

        const robotId = `robot-${uuidv4().substring(0, 8)}`;
        const robotName = `Robo ${this.players.length + 1}`;

        const colors = ['red', 'yellow', 'blue', 'green'];
        const takenColors = this.players.map(p => p.color);
        let availableColor = colors.find(c => !takenColors.includes(c));

        const robot = {
            id: robotId,
            name: robotName,
            color: availableColor,
            tokens: this.initializeTokens(availableColor),
            finishedTokens: 0,
            online: true,
            isRobot: true
        };

        this.players.push(robot);
        return { success: true, player: robot };
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
        console.log(`[LOGIC] rollDice called for ${playerId}`);
        if (!this.gameStarted || this.gameOver) {
            return { success: false, error: 'Game not in progress' };
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        const diceValue = Math.floor(Math.random() * 6) + 1;
        this.lastDiceRoll = diceValue;

        // Track consecutive sixes (3 sixes in a row = lose turn)
        if (diceValue === 6) {
            this.consecutiveSixes++;
            console.log(`[GAME] Player ${currentPlayer.name} (${currentPlayer.color}) rolled a 6. Consecutive sixes: ${this.consecutiveSixes}`);
        } else {
            this.consecutiveSixes = 0;
        }

        // Rule: 3 sixes in a row means you lose your turn
        if (this.consecutiveSixes === 3) {
            console.log(`[GAME] 3 SIXES! Player ${currentPlayer.name} loses turn.`);
            this.lastDiceRoll = null;
            this.nextTurn();
            return {
                success: true,
                diceValue,
                canMove: false,
                turnSkipped: true,
                extraMessage: 'Three sixes! Turn lost.'
            };
        }

        const movableTokens = this.getMovableTokens(currentPlayer, diceValue);
        const canMove = movableTokens.length > 0;

        // If player can't move, determine if they get another roll (if they rolled a 6)
        let turnSkipped = false;
        if (!canMove) {
            if (diceValue === 6) {
                // Rolled a 6 but can't move. They still get another roll.
                this.lastDiceRoll = null; // Clear roll to allow next roll
                turnSkipped = false;
            } else {
                this.lastDiceRoll = null;
                this.nextTurn();
                turnSkipped = true;
            }
        }

        return {
            success: true,
            diceValue,
            canMove,
            turnSkipped,
            movableTokens // Return for potential auto-move logic
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
        console.log(`[LOGIC] moveToken called for ${playerId}, index: ${tokenIndex}`);
        if (!this.gameStarted || this.gameOver) {
            return { success: false, error: 'Game not in progress' };
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        console.log(`[LOGIC] current player is ${currentPlayer.id}, comparing with ${playerId}`);
        if (currentPlayer.id !== playerId) {
            return { success: false, error: 'Not your turn' };
        }

        if (!this.lastDiceRoll) {
            console.log(`[LOGIC] moveToken failed: lastDiceRoll is ${this.lastDiceRoll}`);
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

        // Determine if player gets another turn (rolled a 6 OR captured a token OR finished a token)
        const anotherTurn = (diceValue === 6 || captured !== null || token.finished) && !this.gameOver;

        console.log(`[GAME] Player ${currentPlayer.name} moved. DiceValue: ${diceValue}, Captured: ${captured !== null}, AnotherTurn: ${anotherTurn}`);

        if (!anotherTurn) {
            this.nextTurn();
        } else {
            console.log(`[GAME] Player ${currentPlayer.name} gets another turn.`);
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
     */
    willEnterHomeStretch(currentPos, diceValue, homeEntrance) {
        for (let i = 1; i <= diceValue; i++) {
            const nextPos = (currentPos + i) % this.BOARD_SIZE;
            if (nextPos === homeEntrance) return true;
            if (currentPos < homeEntrance) {
                if (nextPos > currentPos && nextPos >= homeEntrance) return true;
            } else {
                if (nextPos < currentPos && nextPos >= homeEntrance) return true;
            }
        }
        return false;
    }

    /**
     * Calculate how many steps into home stretch
     */
    calculateHomeStretchSteps(currentPos, diceValue, homeEntrance) {
        for (let i = 1; i <= diceValue; i++) {
            const nextPos = (currentPos + i) % this.BOARD_SIZE;
            if (nextPos === homeEntrance ||
                (currentPos < homeEntrance && nextPos >= homeEntrance) ||
                (currentPos > homeEntrance && nextPos < currentPos && nextPos >= homeEntrance)) {
                return diceValue - i;
            }
        }
        return 0;
    }

    /**
     * Check if a token captures another player's tokens
     */
    checkCapture(currentPlayer, position) {
        if (this.SAFE_POSITIONS.includes(position)) return null;
        const capturedList = [];
        const teammateColor = this.getTeammateColor(currentPlayer.color);
        for (let player of this.players) {
            if (player.id === currentPlayer.id) continue;
            if (this.teamMode && player.color === teammateColor) continue;
            for (let i = 0; i < player.tokens.length; i++) {
                const token = player.tokens[i];
                if (token.position === position && !token.inHomeStretch && !token.finished) {
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
        const startIndex = this.currentPlayerIndex;
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.isPlayerEliminated(this.players[this.currentPlayerIndex].id) && this.currentPlayerIndex !== startIndex);

        this.consecutiveSixes = 0;
        this.lastDiceRoll = null; // Always reset dice roll when turn changes
        console.log(`[LOGIC] Turn moved to: ${this.players[this.currentPlayerIndex].name} (Robot: ${this.players[this.currentPlayerIndex].isRobot})`);
    }

    /**
     * Get current game state
     */
    getGameState() {
        return {
            roomId: this.roomId,
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentPlayer: this.players[this.currentPlayerIndex],
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            winner: this.winner,
            lastDiceRoll: this.lastDiceRoll,
            teamMode: this.teamMode,
            teams: this.teams,
            creatorId: this.creatorId
        };
    }

    // --- Team Mode Helpers ---
    initializeTeams() {
        if (this.players.length === 2) {
            this.teams.team1 = ['red'];
            this.teams.team2 = ['yellow'];
        } else if (this.players.length === 4) {
            this.teams.team1 = ['red', 'yellow'];
            this.teams.team2 = ['blue', 'green'];
        }
    }

    isPlayerFinished(playerId) {
        const player = this.players.find(p => p.id === playerId);
        return player && player.finishedTokens === this.TOKENS_PER_PLAYER;
    }

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

    markPlayerFinished(playerId) {
        if (!this.finishedPlayers.includes(playerId)) {
            this.finishedPlayers.push(playerId);
        }
    }

    checkTeamVictory() {
        if (!this.teamMode) return null;
        const t1Finished = this.teams.team1.every(c => {
            const p = this.players.find(pl => pl.color === c);
            return p && p.finishedTokens === this.TOKENS_PER_PLAYER;
        });
        if (t1Finished) return { team: 'team1', players: this.teams.team1 };
        const t2Finished = this.teams.team2.every(c => {
            const p = this.players.find(pl => pl.color === c);
            return p && p.finishedTokens === this.TOKENS_PER_PLAYER;
        });
        if (t2Finished) return { team: 'team2', players: this.teams.team2 };
        return null;
    }

    // --- Timer/AutoPlay Helpers ---
    resetMissedTurns(playerId) {
        this.playerMissedTurns[playerId] = 0;
    }

    incrementMissedTurns(playerId) {
        const player = this.players.find(p => p.id === playerId);
        // Only track missed turns for human players
        if (!player || player.isRobot) return false;

        this.playerMissedTurns[playerId] = (this.playerMissedTurns[playerId] || 0) + 1;
        if (this.playerMissedTurns[playerId] >= 5) {
            console.log(`[LOGIC] Player ${player.name} forfeited due to 5 missed turns.`);
            this.eliminatePlayer(playerId);
            return true;
        }
        return false;
    }

    eliminatePlayer(playerId) {
        if (!this.eliminatedPlayers.includes(playerId)) {
            this.eliminatedPlayers.push(playerId);
            // Remove their tokens from the board so they don't block others
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.tokens.forEach(token => {
                    token.position = -1;
                    token.inHomeStretch = false;
                    token.finished = true; // Mark as "out"
                });
            }
        }
    }

    isPlayerEliminated(playerId) {
        return this.eliminatedPlayers.includes(playerId);
    }

    autoRollDice(playerId) {
        return this.rollDice(playerId);
    }

    autoMoveToken(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !this.lastDiceRoll) return { success: false };
        const movable = this.getMovableTokens(player, this.lastDiceRoll);
        if (movable.length === 0) {
            this.lastDiceRoll = null;
            this.nextTurn();
            return { success: true, noMove: true };
        }
        const index = movable[0]; // Simple AI: pick first
        return this.moveToken(playerId, index, true);
    }

    /**
     * Start the turn timer
     */
    startTurnTimer() {
        this.turnStartTime = Date.now();
    }

    /**
     * Get remaining time for current turn (in seconds)
     */
    getRemainingTime() {
        if (!this.turnStartTime) return this.turnTimeLimit;
        const elapsed = Math.floor((Date.now() - this.turnStartTime) / 1000);
        return Math.max(0, this.turnTimeLimit - elapsed);
    }
}

module.exports = LudoGame;
