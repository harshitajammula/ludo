// Quick test script - Paste this in browser console to test board rendering

console.log('=== LUDO BOARD DEBUG ===');

// Initialize the board first
if (typeof initializeGameBoard === 'function') {
    initializeGameBoard();
    console.log('✓ Board initialized');
}

// Create debug state
if (typeof createDebugGameState === 'function') {
    window.testState = createDebugGameState();
    window.testState.currentPlayer = window.testState.players[0];
    console.log('✓ Debug state created:', window.testState);

    // Render the board
    if (typeof window.renderGameBoard === 'function') {
        window.renderGameBoard(window.testState);
        console.log('✓ Board rendered!');
    } else {
        console.error('✗ renderGameBoard not found');
    }
} else {
    console.error('✗ createDebugGameState not found');
}

console.log('\nTo manually test:');
console.log('1. window.renderGameBoard(window.testState)');
console.log('2. Check if you see the board with colored home bases');
