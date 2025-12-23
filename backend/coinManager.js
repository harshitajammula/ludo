/**
 * Player Coin/Currency Management
 * Handles player coins, entry fees, and rewards
 */

const DEFAULT_COINS = 5000;
const ENTRY_FEE = 200;
const REWARDS = {
    first: 500,
    second: 200,
    third: 100
};

class CoinManager {
    constructor() {
        // In-memory storage (should be replaced with database in production)
        this.playerCoins = new Map();
    }

    /**
     * Initialize player with default coins
     */
    initializePlayer(playerId) {
        if (!this.playerCoins.has(playerId)) {
            this.playerCoins.set(playerId, DEFAULT_COINS);
        }
    }

    /**
     * Get player's coin balance
     */
    getBalance(playerId) {
        this.initializePlayer(playerId);
        return this.playerCoins.get(playerId);
    }

    /**
     * Check if player can afford entry fee
     */
    canAffordEntry(playerId) {
        return this.getBalance(playerId) >= ENTRY_FEE;
    }

    /**
     * Deduct entry fee from player
     */
    deductEntryFee(playerId) {
        if (!this.canAffordEntry(playerId)) {
            return { success: false, error: 'Insufficient coins' };
        }

        const currentBalance = this.getBalance(playerId);
        this.playerCoins.set(playerId, currentBalance - ENTRY_FEE);

        return {
            success: true,
            newBalance: this.getBalance(playerId),
            deducted: ENTRY_FEE
        };
    }

    /**
     * Add coins to player
     */
    addCoins(playerId, amount) {
        const currentBalance = this.getBalance(playerId);
        this.playerCoins.set(playerId, currentBalance + amount);

        return {
            success: true,
            newBalance: this.getBalance(playerId),
            added: amount
        };
    }

    /**
     * Distribute rewards to winners
     */
    distributeRewards(winners) {
        const results = [];

        // First place
        if (winners.length >= 1) {
            const result = this.addCoins(winners[0].id, REWARDS.first);
            results.push({
                playerId: winners[0].id,
                playerName: winners[0].name,
                position: 1,
                reward: REWARDS.first,
                newBalance: result.newBalance
            });
        }

        // Second place
        if (winners.length >= 2) {
            const result = this.addCoins(winners[1].id, REWARDS.second);
            results.push({
                playerId: winners[1].id,
                playerName: winners[1].name,
                position: 2,
                reward: REWARDS.second,
                newBalance: result.newBalance
            });
        }

        // Third place
        if (winners.length >= 3) {
            const result = this.addCoins(winners[2].id, REWARDS.third);
            results.push({
                playerId: winners[2].id,
                playerName: winners[2].name,
                position: 3,
                reward: REWARDS.third,
                newBalance: result.newBalance
            });
        }

        return results;
    }

    /**
     * Get all player balances (for admin/debugging)
     */
    getAllBalances() {
        const balances = {};
        this.playerCoins.forEach((balance, playerId) => {
            balances[playerId] = balance;
        });
        return balances;
    }
}

// Create singleton instance
const coinManager = new CoinManager();

module.exports = {
    coinManager,
    DEFAULT_COINS,
    ENTRY_FEE,
    REWARDS
};
