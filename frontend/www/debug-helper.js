/**
 * Debug Helper - Create Test Game State
 * Use this to quickly test the game with 4 players
 */

// Add this function to ui.js or create a new debug.js file
function createDebugGameState() {
    return {
        roomId: 'DEBUG',
        players: [
            {
                id: 'player1',
                name: 'Red Player',
                color: 'red',
                tokens: [
                    { position: 5, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'player2',
                name: 'Green Player',
                color: 'green',
                tokens: [
                    { position: 18, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'player3',
                name: 'Yellow Player',
                color: 'yellow',
                tokens: [
                    { position: 31, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false }
                ],
                finishedTokens: 0
            },
            {
                id: 'player4',
                name: 'Blue Player',
                color: 'blue',
                tokens: [
                    { position: 44, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false },
                    { position: -1, inHomeStretch: false, homeStretchPosition: 0, finished: false }
                ],
                finishedTokens: 0
            }
        ],
        currentPlayerIndex: 0,
        currentPlayer: null,
        gameStarted: true,
        gameOver: false,
        winner: null,
        lastDiceRoll: null
    };
}

// To use this in the browser console:
// 1. Open browser console (F12)
// 2. Type: currentGameState = createDebugGameState()
// 3. Type: renderGameBoard(currentGameState)
// 4. Type: updatePlayerDice(currentGameState)

window.createDebugGameState = createDebugGameState;
