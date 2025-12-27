/**
 * Game Board Rendering - Classic Ludo Style
 * Handles canvas-based game board visualization and token interactions
 */

let canvas = null;
let ctx = null;
let currentGameState = null;
let selectedTokenIndex = null;
let currentBoardRotation = 0; // Current rotation in radians

// Board configuration - Classic Ludo style
const BOARD_CONFIG = {
    size: 600,
    cellSize: 40,
    tokenRadius: 18,
    colors: {
        red: '#E53935',      // Classic red
        blue: '#1E88E5',     // Classic blue
        green: '#43A047',    // Classic green
        yellow: '#FDD835'    // Classic yellow
    },
    gradients: {
        red: ['#EF5350', '#E53935'],
        blue: ['#42A5F5', '#1E88E5'],
        green: ['#66BB6A', '#43A047'],
        yellow: ['#FFEB3B', '#FDD835']
    },
    boardBg: '#FFFFFF',      // White background
    pathColor: '#FFFFFF',     // White path
    pathBorder: '#000000',    // Black border
    safeColor: '#FFFFFF',     // White for safe positions
    homeColor: '#FFFFFF',
    debugMode: false  // Enable debug mode to show position numbers
};

// Safe positions on the board (star positions) - classic Ludo placement
// Stars at starting positions (0,13,26,39) + middle positions (8,21,34,47)
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Get path positions array
 * Returns all 72 positions (0-51 main path + safe zones)
 */
function getPathPositions(cellSize) {
    const pathPositions = [];

    pathPositions[0] = { x: cellSize * 6.5, y: cellSize * 13.5 };
    pathPositions[1] = { x: cellSize * 6.5, y: cellSize * 12.5 };
    pathPositions[2] = { x: cellSize * 6.5, y: cellSize * 11.5 };
    pathPositions[3] = { x: cellSize * 6.5, y: cellSize * 10.5 };
    pathPositions[4] = { x: cellSize * 6.5, y: cellSize * 9.5 };
    pathPositions[5] = { x: cellSize * 5.5, y: cellSize * 8.5 };
    pathPositions[6] = { x: cellSize * 4.5, y: cellSize * 8.5 };
    pathPositions[7] = { x: cellSize * 3.5, y: cellSize * 8.5 };
    pathPositions[8] = { x: cellSize * 2.5, y: cellSize * 8.5 };
    pathPositions[9] = { x: cellSize * 1.5, y: cellSize * 8.5 };
    pathPositions[10] = { x: cellSize * 0.5, y: cellSize * 8.5 };
    pathPositions[11] = { x: cellSize * 0.5, y: cellSize * 7.5 };
    pathPositions[12] = { x: cellSize * 0.5, y: cellSize * 6.5 };
    pathPositions[13] = { x: cellSize * 1.5, y: cellSize * 6.5 };
    pathPositions[14] = { x: cellSize * 2.5, y: cellSize * 6.5 };
    pathPositions[15] = { x: cellSize * 3.5, y: cellSize * 6.5 };
    pathPositions[16] = { x: cellSize * 4.5, y: cellSize * 6.5 };
    pathPositions[17] = { x: cellSize * 5.5, y: cellSize * 6.5 };
    pathPositions[18] = { x: cellSize * 6.5, y: cellSize * 5.5 };
    pathPositions[19] = { x: cellSize * 6.5, y: cellSize * 4.5 };
    pathPositions[20] = { x: cellSize * 6.5, y: cellSize * 3.5 };
    pathPositions[21] = { x: cellSize * 6.5, y: cellSize * 2.5 };
    pathPositions[22] = { x: cellSize * 6.5, y: cellSize * 1.5 };
    pathPositions[23] = { x: cellSize * 6.5, y: cellSize * 0.5 };
    pathPositions[24] = { x: cellSize * 7.5, y: cellSize * 0.5 };
    pathPositions[25] = { x: cellSize * 8.5, y: cellSize * 0.5 };
    pathPositions[26] = { x: cellSize * 8.5, y: cellSize * 1.5 };
    pathPositions[27] = { x: cellSize * 8.5, y: cellSize * 2.5 };
    pathPositions[28] = { x: cellSize * 8.5, y: cellSize * 3.5 };
    pathPositions[29] = { x: cellSize * 8.5, y: cellSize * 4.5 };
    pathPositions[30] = { x: cellSize * 8.5, y: cellSize * 5.5 };
    pathPositions[31] = { x: cellSize * 9.5, y: cellSize * 6.5 };
    pathPositions[32] = { x: cellSize * 10.5, y: cellSize * 6.5 };
    pathPositions[33] = { x: cellSize * 11.5, y: cellSize * 6.5 };
    pathPositions[34] = { x: cellSize * 12.5, y: cellSize * 6.5 };
    pathPositions[35] = { x: cellSize * 13.5, y: cellSize * 6.5 };
    pathPositions[36] = { x: cellSize * 14.5, y: cellSize * 6.5 };
    pathPositions[37] = { x: cellSize * 14.5, y: cellSize * 7.5 };
    pathPositions[38] = { x: cellSize * 14.5, y: cellSize * 8.5 };
    pathPositions[39] = { x: cellSize * 13.5, y: cellSize * 8.5 };
    pathPositions[40] = { x: cellSize * 12.5, y: cellSize * 8.5 };
    pathPositions[41] = { x: cellSize * 11.5, y: cellSize * 8.5 };
    pathPositions[42] = { x: cellSize * 10.5, y: cellSize * 8.5 };
    pathPositions[43] = { x: cellSize * 9.5, y: cellSize * 8.5 };
    pathPositions[44] = { x: cellSize * 8.5, y: cellSize * 9.5 };
    pathPositions[45] = { x: cellSize * 8.5, y: cellSize * 10.5 };
    pathPositions[46] = { x: cellSize * 8.5, y: cellSize * 11.5 };
    pathPositions[47] = { x: cellSize * 8.5, y: cellSize * 12.5 };
    pathPositions[48] = { x: cellSize * 8.5, y: cellSize * 13.5 };
    pathPositions[49] = { x: cellSize * 8.5, y: cellSize * 14.5 };
    pathPositions[50] = { x: cellSize * 7.5, y: cellSize * 14.5 };
    pathPositions[51] = { x: cellSize * 6.5, y: cellSize * 14.5 }; // Correct peripheral corner before 0

    // RED HOME STRETCH (52-56) - Corrected row offsets
    pathPositions[52] = { x: cellSize * 7.5, y: cellSize * 13.5 }; // Red home 1
    pathPositions[53] = { x: cellSize * 7.5, y: cellSize * 12.5 }; // Red home 2
    pathPositions[54] = { x: cellSize * 7.5, y: cellSize * 11.5 }; // Red home 3
    pathPositions[55] = { x: cellSize * 7.5, y: cellSize * 10.5 }; // Red home 4
    pathPositions[56] = { x: cellSize * 7.5, y: cellSize * 9.5 };  // Red home 5 (last before center)

    pathPositions[57] = { x: cellSize * 1.5, y: cellSize * 7.5 }; // Green home 1

    // GREEN HOME STRETCH (58-62) - Positions after 13, going toward center
    pathPositions[58] = { x: cellSize * 2.5, y: cellSize * 7.5 }; // Green home 2
    pathPositions[59] = { x: cellSize * 3.5, y: cellSize * 7.5 }; // Green home 3
    pathPositions[60] = { x: cellSize * 4.5, y: cellSize * 7.5 }; // Green home 4
    pathPositions[61] = { x: cellSize * 5.5, y: cellSize * 7.5 }; // Green home 5 (last before center)
    pathPositions[62] = { x: cellSize * 6.5, y: cellSize * 7.5 }; // Not used

    // YELLOW HOME STRETCH (63-67) - Positions after 26, going toward center
    pathPositions[63] = { x: cellSize * 7.5, y: cellSize * 1.5 }; // Yellow home 1
    pathPositions[64] = { x: cellSize * 7.5, y: cellSize * 2.5 }; // Yellow home 2
    pathPositions[65] = { x: cellSize * 7.5, y: cellSize * 3.5 }; // Yellow home 3
    pathPositions[66] = { x: cellSize * 7.5, y: cellSize * 4.5 }; // Yellow home 4
    pathPositions[67] = { x: cellSize * 7.5, y: cellSize * 5.5 }; // Yellow home 5 (last before center)

    // BLUE HOME STRETCH (68-72) - Positions after 39, going toward center
    pathPositions[68] = { x: cellSize * 13.5, y: cellSize * 7.5 }; // Blue home 1
    pathPositions[69] = { x: cellSize * 12.5, y: cellSize * 7.5 }; // Blue home 2
    pathPositions[70] = { x: cellSize * 11.5, y: cellSize * 7.5 }; // Blue home 3
    pathPositions[71] = { x: cellSize * 10.5, y: cellSize * 7.5 }; // Blue home 4
    pathPositions[72] = { x: cellSize * 9.5, y: cellSize * 7.5 };  // Blue home 5 (last before center)

    return pathPositions;
}

/**
 * Initialize game board
 */
function initializeGameBoard() {
    canvas = document.getElementById('gameBoard');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

/**
 * Resize canvas for responsiveness
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxSize = Math.min(container.clientWidth, 600);
    canvas.width = maxSize;
    canvas.height = maxSize;
    if (currentGameState) {
        window.renderGameBoard(currentGameState);
    }
}

/**
 * Render the complete game board
 */
window.renderGameBoard = function renderGameBoard(gameState) {
    currentGameState = gameState;

    if (!canvas) {
        canvas = document.getElementById('gameBoard');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        const maxSize = Math.min(container.clientWidth, 600);
        canvas.width = maxSize;
        canvas.height = maxSize;
        window.addEventListener('resize', resizeCanvas);
    }

    if (!ctx) {
        console.error('Canvas context not available!');
        return;
    }

    // Start animation loop for pulsing effects
    if (!window.gameAnimationRunning) {
        window.gameAnimationRunning = true;
        animateBoard();
    }
};

/**
 * Animation loop for smooth pulsing effects
 */
function animateBoard() {
    if (!currentGameState) {
        window.gameAnimationRunning = false;
        return;
    }

    const size = canvas.width;
    const scale = size / BOARD_CONFIG.size;

    // Clear board first
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = BOARD_CONFIG.boardBg;
    ctx.fillRect(0, 0, size, size);

    ctx.save();

    // Determine rotation based on current player's color
    // We want the player's home base to be in the bottom-left corner
    const myPlayer = currentGameState.players.find(p => p.id === currentPlayerId);
    if (myPlayer) {
        switch (myPlayer.color) {
            case 'red': currentBoardRotation = 0; break;
            case 'blue': currentBoardRotation = Math.PI / 2; break;      // 90 deg CW
            case 'yellow': currentBoardRotation = Math.PI; break;       // 180 deg CW
            case 'green': currentBoardRotation = 3 * Math.PI / 2; break; // 270 deg CW
            default: currentBoardRotation = 0;
        }
    } else {
        currentBoardRotation = 0;
    }

    // Apply rotation around center
    const center = size / 2;
    ctx.translate(center, center);
    ctx.rotate(currentBoardRotation);
    ctx.translate(-center, -center);

    drawClassicBoard(scale);

    currentGameState.players.forEach(player => {
        drawPlayerTokens(player, scale);
    });

    ctx.restore();

    requestAnimationFrame(animateBoard);
}

function drawClassicBoard(scale) {
    const size = canvas.width;
    const cellSize = BOARD_CONFIG.cellSize * scale;

    // Draw home bases with proper spacing (starting at 0,0 for each corner)
    // Each home base is 6x6 cells
    const getPlayerByColor = (color) => currentGameState?.players.find(p => p.color === color);

    drawHomeBase(0, 0, 'green', scale, getPlayerByColor('green')?.name);
    drawHomeBase(size - cellSize * 6, 0, 'yellow', scale, getPlayerByColor('yellow')?.name);
    drawHomeBase(0, size - cellSize * 6, 'red', scale, getPlayerByColor('red')?.name);
    drawHomeBase(size - cellSize * 6, size - cellSize * 6, 'blue', scale, getPlayerByColor('blue')?.name);

    drawCrossPath(scale);
    drawHomeStretch(scale, 'green', 'top');
    drawHomeStretch(scale, 'yellow', 'right');
    drawHomeStretch(scale, 'red', 'bottom');
    drawHomeStretch(scale, 'blue', 'left');
    drawCenterTriangle(scale);

    // Draw position numbers first (if debug mode)
    if (BOARD_CONFIG.debugMode) {
        drawPositionNumbers(scale);
    }

    // Removed: Starting position arrows (colored triangles at 11, 24, 37)
    // drawStartingPositionArrows(scale);

    // Draw stars AFTER position numbers so they appear on top
    drawSafeZones(scale);
}

/**
 * Draw a home base with classic Ludo styling
 */
function drawHomeBase(x, y, color, scale, playerName) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const baseSize = cellSize * 6;

    // Draw solid colored background (classic Ludo style)
    ctx.fillStyle = BOARD_CONFIG.colors[color];
    ctx.fillRect(x, y, baseSize, baseSize);

    // Draw black border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(x, y, baseSize, baseSize);

    // Draw player name at the top or bottom of the base
    if (playerName) {
        ctx.save();
        const centerX = x + baseSize / 2;
        const centerY = y + cellSize * 0.8;

        ctx.translate(centerX, centerY);
        // Counter-rotate text so it stays upright for the viewer
        ctx.rotate(-currentBoardRotation);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${cellSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add subtle shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4 * scale;

        // Use first name if too long
        const displayName = playerName.length > 8 ? playerName.split(' ')[0] : playerName;
        ctx.fillText(displayName, 0, 0);
        ctx.restore();
    }

    // Draw white boxes for token positions
    const boxSize = cellSize * 1.5;
    const tokenPositions = [
        [x + cellSize * 2, y + cellSize * 2],
        [x + cellSize * 4, y + cellSize * 2],
        [x + cellSize * 2, y + cellSize * 4],
        [x + cellSize * 4, y + cellSize * 4]
    ];

    tokenPositions.forEach(([posX, posY]) => {
        // Draw white box
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(posX - boxSize / 2, posY - boxSize / 2, boxSize, boxSize);

        // Draw black border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(posX - boxSize / 2, posY - boxSize / 2, boxSize, boxSize);
    });
}

/**
 * Draw the cross-shaped path
 */
function drawCrossPath(scale) {
    const size = canvas.width;
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const pathWidth = cellSize * 3;

    ctx.fillStyle = BOARD_CONFIG.pathColor;
    ctx.fillRect(cellSize * 6, 0, pathWidth, size);
    ctx.fillRect(0, cellSize * 6, size, pathWidth);

    // Draw colored starting positions (0, 13, 26, 39)
    const entrancePositions = [
        { position: 0, color: 'red' },      // Red starts at position 0
        { position: 13, color: 'green' },   // Green starts at position 13
        { position: 26, color: 'yellow' },  // Yellow starts at position 26
        { position: 39, color: 'blue' }     // Blue starts at position 39
    ];

    const pathPositions = getPathPositions(cellSize);
    entrancePositions.forEach(({ position, color }) => {
        const pos = pathPositions[position];
        if (pos) {
            ctx.fillStyle = BOARD_CONFIG.colors[color];
            ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, cellSize);
        }
    });

    ctx.strokeStyle = BOARD_CONFIG.pathBorder;
    ctx.lineWidth = 1 * scale;

    for (let i = 0; i <= 3; i++) {
        const x = cellSize * 6 + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
    }

    for (let i = 0; i <= 3; i++) {
        const y = cellSize * 6 + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
    }

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const x = cellSize * i;
            const y = cellSize * j;
            if ((i >= 6 && i < 9) || (j >= 6 && j < 9)) {
                ctx.strokeStyle = BOARD_CONFIG.pathBorder;
                ctx.lineWidth = 1 * scale;
                ctx.strokeRect(x, y, cellSize, cellSize);
            }
        }
    }
}

/**
 * Draw home stretch
 * Draws the colored safe zone paths leading to center
 */
function drawHomeStretch(scale, color, direction) {
    const cellSize = BOARD_CONFIG.cellSize * scale;

    ctx.fillStyle = BOARD_CONFIG.colors[color];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;

    // Draw 5 colored squares for each player's home stretch
    // Based on the actual pathPositions mapping
    const homeStretchPositions = {
        red: [
            { x: cellSize * 7.5, y: cellSize * 13.5 }, // 52
            { x: cellSize * 7.5, y: cellSize * 12.5 }, // 53
            { x: cellSize * 7.5, y: cellSize * 11.5 }, // 54
            { x: cellSize * 7.5, y: cellSize * 10.5 }, // 55
            { x: cellSize * 7.5, y: cellSize * 9.5 }   // 56
        ],
        green: [
            { x: cellSize * 1.5, y: cellSize * 7.5 }, // 57
            { x: cellSize * 2.5, y: cellSize * 7.5 }, // 58
            { x: cellSize * 3.5, y: cellSize * 7.5 }, // 59
            { x: cellSize * 4.5, y: cellSize * 7.5 }, // 60
            { x: cellSize * 5.5, y: cellSize * 7.5 }  // 61
        ],
        yellow: [
            { x: cellSize * 7.5, y: cellSize * 1.5 }, // 63
            { x: cellSize * 7.5, y: cellSize * 2.5 }, // 64
            { x: cellSize * 7.5, y: cellSize * 3.5 }, // 65
            { x: cellSize * 7.5, y: cellSize * 4.5 }, // 66
            { x: cellSize * 7.5, y: cellSize * 5.5 }  // 67
        ],
        blue: [
            { x: cellSize * 13.5, y: cellSize * 7.5 }, // 68
            { x: cellSize * 12.5, y: cellSize * 7.5 }, // 69
            { x: cellSize * 11.5, y: cellSize * 7.5 }, // 70
            { x: cellSize * 10.5, y: cellSize * 7.5 }, // 71
            { x: cellSize * 9.5, y: cellSize * 7.5 }   // 72
        ]
    };

    const positions = homeStretchPositions[color];

    positions.forEach(pos => {
        // Draw filled square
        ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, cellSize);
        // Draw border
        ctx.strokeRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, cellSize);
    });
}

/**
 * Draw center triangle
 */
function drawCenterTriangle(scale) {
    const size = canvas.width;
    const center = size / 2;
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const triangleSize = cellSize * 3;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(center - triangleSize / 2, center - triangleSize / 2, triangleSize, triangleSize);

    const colors = [
        { color: 'green', angle: 0 },
        { color: 'yellow', angle: 90 },
        { color: 'blue', angle: 180 },
        { color: 'red', angle: 270 }
    ];

    colors.forEach(({ color, angle }) => {
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate((angle * Math.PI) / 180);

        ctx.fillStyle = BOARD_CONFIG.colors[color];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-triangleSize / 2, -triangleSize / 2);
        ctx.lineTo(triangleSize / 2, -triangleSize / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        ctx.restore();
    });

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center, center, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
}

/**
 * Draw starting position arrows (Ludo King style)
 * Marks the starting positions for each color with colored arrows
 */
function drawStartingPositionArrows(scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const pathPositions = getPathPositions(cellSize);

    // Starting positions: Red=0, Green=13, Yellow=26, Blue=39
    const startingPositions = [
        { position: 0, color: 'red', rotation: 0 },      // Red starts at position 0
        { position: 13, color: 'green', rotation: 90 },  // Green starts at position 13
        { position: 26, color: 'yellow', rotation: 180 }, // Yellow starts at position 26
        { position: 39, color: 'blue', rotation: 270 }   // Blue starts at position 39
    ];

    startingPositions.forEach(({ position, color, rotation }) => {
        const pos = pathPositions[position];
        if (pos) {
            drawArrowMarker(pos.x, pos.y, cellSize * 0.7, color, rotation, scale);
        }
    });
}

/**
 * Draw an arrow marker for starting positions
 */
function drawArrowMarker(x, y, size, color, rotation, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw arrow triangle
    const arrowSize = size * 0.5;
    ctx.fillStyle = BOARD_CONFIG.colors[color];
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize * 0.7);
    ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.3);
    ctx.lineTo(arrowSize * 0.5, arrowSize * 0.3);
    ctx.closePath();
    ctx.fill();

    // Arrow border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw safe zones (stars) - Ludo King style cute stars
 * Stars mark safe positions where tokens cannot be captured
 * Safe positions shifted backward by 1: [51, 12, 20, 25, 33, 38, 46]
 */
function drawSafeZones(scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const pathPositions = getPathPositions(cellSize);

    // Use the SAFE_POSITIONS constant (shifted backward by 1)
    SAFE_POSITIONS.forEach(position => {
        const pos = pathPositions[position];
        if (pos) {
            drawCuteStar(pos.x, pos.y, cellSize * 0.35, scale);
        }
    });
}

/**
 * Draw a cute star shape (Ludo King style)
 */
function drawCuteStar(x, y, radius, scale) {
    // Draw outer glow
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 10 * scale;

    // Main star body with gradient
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#FFF9C4');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FFA000');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Draw 8-pointed star with rounded tips
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.4;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Star border
    ctx.strokeStyle = '#F57F17';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Add sparkle in center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Add tiny sparkles around
    const sparklePositions = [
        { x: x + radius * 0.5, y: y - radius * 0.3 },
        { x: x - radius * 0.4, y: y + radius * 0.4 },
        { x: x + radius * 0.3, y: y + radius * 0.5 }
    ];

    sparklePositions.forEach(pos => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Draw position numbers
 */
function drawPositionNumbers(scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;

    for (let i = 0; i < 52; i++) {
        const pos = getBoardPosition(i, cellSize);

        if (pos) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, cellSize * 0.35, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.font = `bold ${cellSize * 0.4}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), pos.x, pos.y);
        }
    }
}

/**
 * Draw player tokens as pin-shaped pieces
 */
function drawPlayerTokens(player, scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;

    player.tokens.forEach((token, index) => {
        // Use getVisualPosition to account for overlapping tokens
        const visualPos = getVisualPosition(player.color, index, currentGameState, cellSize);

        if (visualPos) {
            const pinWidth = BOARD_CONFIG.tokenRadius * scale * 0.6 * visualPos.scaleDown;
            const pinHeight = BOARD_CONFIG.tokenRadius * scale * 2.5 * visualPos.scaleDown;

            drawPin(visualPos.x, visualPos.y, pinWidth, pinHeight, player.color, scale);

            // Highlight if movable (own or teammate's if finished)
            const isOurTurn = currentGameState.currentPlayer && currentGameState.currentPlayer.id === window.currentPlayerId;
            const myColor = currentGameState.players.find(p => p.id === window.currentPlayerId)?.color;
            const isTeammate = isTeammateOf(player.color, myColor, currentGameState);
            const canPlayerControl = player.id === window.currentPlayerId || (isTeammate && isPlayerFinished(window.currentPlayerId, currentGameState));

            if (isOurTurn && canPlayerControl && canMoveToken(player, index)) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15 * scale;
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3 * scale;

                ctx.beginPath();
                ctx.ellipse(visualPos.x, visualPos.y + pinHeight * 0.15, pinWidth * 1.3, pinWidth * 0.8, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    });
}

/**
 * Draw a single pin-shaped token
 */
function drawPin(x, y, width, height, color, scale) {
    const baseRadius = width;
    const neckWidth = width * 0.5;
    const headRadius = width * 0.9;

    // Pin structure from bottom to top:
    // 1. Base (flat ellipse)
    // 2. Neck (narrow cylinder)
    // 3. Head (sphere/circle)

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 2 * scale, y + height * 0.4 + 3 * scale, baseRadius * 1.1, baseRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // === DRAW BASE ===
    // Base bottom (darker)
    const baseGradient = ctx.createLinearGradient(x, y + height * 0.3, x, y + height * 0.4);
    baseGradient.addColorStop(0, BOARD_CONFIG.gradients[color][1]);
    baseGradient.addColorStop(1, BOARD_CONFIG.colors[color]);

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + height * 0.35, baseRadius, baseRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base border
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // === DRAW NECK (BODY) ===
    const neckGradient = ctx.createLinearGradient(x - neckWidth, y - height * 0.2, x + neckWidth, y - height * 0.2);
    neckGradient.addColorStop(0, BOARD_CONFIG.gradients[color][1]);
    neckGradient.addColorStop(0.5, BOARD_CONFIG.colors[color]);
    neckGradient.addColorStop(1, BOARD_CONFIG.gradients[color][1]);

    ctx.fillStyle = neckGradient;
    ctx.fillRect(x - neckWidth, y - height * 0.2, neckWidth * 2, height * 0.55);

    // Neck borders
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(x - neckWidth, y + height * 0.35);
    ctx.lineTo(x - neckWidth, y - height * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + neckWidth, y + height * 0.35);
    ctx.lineTo(x + neckWidth, y - height * 0.2);
    ctx.stroke();

    // === DRAW HEAD (TOP SPHERE) ===
    // Head gradient (radial for 3D effect)
    const headGradient = ctx.createRadialGradient(
        x - headRadius * 0.3,
        y - height * 0.25,
        headRadius * 0.1,
        x,
        y - height * 0.2,
        headRadius
    );
    headGradient.addColorStop(0, BOARD_CONFIG.gradients[color][0]);
    headGradient.addColorStop(0.7, BOARD_CONFIG.colors[color]);
    headGradient.addColorStop(1, BOARD_CONFIG.gradients[color][1]);

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(x, y - height * 0.2, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head border
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Add glossy highlight on head
    const highlightGradient = ctx.createRadialGradient(
        x - headRadius * 0.35,
        y - height * 0.3,
        0,
        x - headRadius * 0.35,
        y - height * 0.3,
        headRadius * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x - headRadius * 0.3, y - height * 0.3, headRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Get pixel position for a token
 */
/**
 * Get visual position for a token, accounting for overlaps
 */
function getVisualPosition(playerColor, tokenIndex, gameState, cellSize) {
    if (!gameState) return null;
    const player = gameState.players.find(p => p.color === playerColor);
    if (!player) return null;
    const token = player.tokens[tokenIndex];
    if (!token) return null;

    const basePos = getTokenPosition(playerColor, token, cellSize);

    // No clustering for home base or finished tokens
    if (token.position === -1 || token.finished) {
        return { ...basePos, scaleDown: 1.0 };
    }

    // Find overlapping tokens
    const overlaps = [];
    gameState.players.forEach(p => {
        p.tokens.forEach((t, i) => {
            if (t.position === -1 || t.finished) return;

            const samePath = (!t.inHomeStretch && !token.inHomeStretch && t.position === token.position);
            const sameHome = (t.inHomeStretch && token.inHomeStretch &&
                t.homeStretchPosition === token.homeStretchPosition && p.color === playerColor);

            if (samePath || sameHome) {
                overlaps.push({ color: p.color, index: i });
            }
        });
    });

    if (overlaps.length <= 1) {
        return { ...basePos, scaleDown: 1.0 };
    }

    // Stable sort for consistent layout
    overlaps.sort((a, b) => a.color.localeCompare(b.color) || a.index - b.index);
    const selfIdx = overlaps.findIndex(o => o.color === playerColor && o.index === tokenIndex);

    const count = overlaps.length;
    let offsetX = 0;
    let offsetY = 0;
    let scaleDown = 1.0;

    // Clustering patterns
    if (count === 2) {
        const offset = cellSize * 0.15;
        offsetX = (selfIdx === 0) ? -offset : offset;
        scaleDown = 0.85;
    } else if (count === 3) {
        const radius = cellSize * 0.18;
        const angle = (selfIdx * 120 - 90) * (Math.PI / 180);
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
        scaleDown = 0.75;
    } else {
        const radius = cellSize * 0.22;
        const angle = (selfIdx * (360 / count) - 90) * (Math.PI / 180);
        offsetX = Math.cos(angle) * radius;
        offsetY = Math.sin(angle) * radius;
        scaleDown = 0.7;
    }

    return { x: basePos.x + offsetX, y: basePos.y + offsetY, scaleDown };
}

function getTokenPosition(color, token, cellSize) {
    const size = canvas.width;
    const center = size / 2;

    if (token.position === -1) {
        return getStartingAreaPosition(color, token.id, cellSize);
    }

    if (token.finished) {
        return { x: center, y: center };
    }

    if (token.inHomeStretch) {
        return getHomeStretchPosition(color, token.homeStretchPosition, cellSize);
    }

    return getBoardPosition(token.position, cellSize);
}

/**
 * Get starting area position
 */
function getStartingAreaPosition(color, tokenId, cellSize) {
    // Evenly space tokens in the 6x6 home base
    // Using 2 columns and 2 rows with better spacing
    const positions = {
        green: [
            [cellSize * 2, cellSize * 2],
            [cellSize * 4, cellSize * 2],
            [cellSize * 2, cellSize * 4],
            [cellSize * 4, cellSize * 4]
        ],
        yellow: [
            [canvas.width - cellSize * 4, cellSize * 2],
            [canvas.width - cellSize * 2, cellSize * 2],
            [canvas.width - cellSize * 4, cellSize * 4],
            [canvas.width - cellSize * 2, cellSize * 4]
        ],
        red: [
            [cellSize * 2, canvas.height - cellSize * 4],
            [cellSize * 4, canvas.height - cellSize * 4],
            [cellSize * 2, canvas.height - cellSize * 2],
            [cellSize * 4, canvas.height - cellSize * 2]
        ],
        blue: [
            [canvas.width - cellSize * 4, canvas.height - cellSize * 4],
            [canvas.width - cellSize * 2, canvas.height - cellSize * 4],
            [canvas.width - cellSize * 4, canvas.height - cellSize * 2],
            [canvas.width - cellSize * 2, canvas.height - cellSize * 2]
        ]
    };

    const [x, y] = positions[color][tokenId];
    return { x, y };
}

/**
 * Get home stretch position
 */
function getHomeStretchPosition(color, position, cellSize) {
    const size = canvas.width;
    const center = size / 2;

    const directions = {
        red: { x: center, y: size - cellSize * (1.5 + position) },   // Bottom arm, goes UP (1.5, 2.5, ...)
        green: { x: cellSize * (1.5 + position), y: center },        // Left arm, goes RIGHT
        yellow: { x: center, y: cellSize * (1.5 + position) },       // Top arm, goes DOWN
        blue: { x: size - cellSize * (1.5 + position), y: center }   // Right arm, goes LEFT
    };

    return directions[color];
}

/**
 * Get board position
 */
function getBoardPosition(position, cellSize) {
    const pathPositions = getPathPositions(cellSize);

    if (position >= 0 && position < pathPositions.length) {
        return pathPositions[position];
    }

    const size = canvas.width;
    return { x: size / 2, y: size / 2 };
}

/**
 * Check if a token can be moved
 */
function canMoveToken(player, tokenIndex) {
    if (!currentGameState || !currentGameState.lastDiceRoll) return false;

    // In team mode, current player can move teammate's token if they are finished
    const currentPlayer = currentGameState.currentPlayer;
    const isTeammate = isTeammateOf(player.color, currentPlayer.color, currentGameState);
    const canControl = player.id === currentPlayer.id || (isTeammate && isPlayerFinished(currentPlayer.id, currentGameState));

    if (!canControl) return false;

    const token = player.tokens[tokenIndex];
    const diceValue = currentGameState.lastDiceRoll;

    // 1. Token in starting area - can only move with a 6
    if (token.position === -1) {
        return diceValue === 6;
    }

    // 2. Token finished - can't move
    if (token.finished) {
        return false;
    }

    // 3. Token in home stretch - must land exactly or within center
    if (token.inHomeStretch) {
        // HOME_STRETCH_LENGTH is 5
        return (token.homeStretchPosition + diceValue) <= 5;
    }

    // 4. Token on main board - can always move
    return true;
}

/**
 * Handle token click
 */
window.handleTokenClick = function (event) {
    if (!currentGameState || !currentGameState.lastDiceRoll) return;
    if (currentGameState.currentPlayer.id !== window.currentPlayerId) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Inverse transform mouse coordinates from rotated canvas to board coordinates
    const size = canvas.width;
    const center = size / 2;
    const a = currentBoardRotation;

    // x = C + (mx-C)cos(a) + (my-C)sin(a)
    // y = C - (mx-C)sin(a) + (my-C)cos(a)
    const x = center + (mouseX - center) * Math.cos(a) + (mouseY - center) * Math.sin(a);
    const y = center - (mouseX - center) * Math.sin(a) + (mouseY - center) * Math.cos(a);

    const scale = canvas.width / BOARD_CONFIG.size;
    const tokenRadius = BOARD_CONFIG.tokenRadius * scale;

    // Check all players we can control
    const victims = currentGameState.players.filter(p => {
        const isSelf = p.id === window.currentPlayerId;
        const myColor = currentGameState.players.find(pl => pl.id === window.currentPlayerId)?.color;
        const isTeammate = isTeammateOf(p.color, myColor, currentGameState);
        return isSelf || (isTeammate && isPlayerFinished(window.currentPlayerId, currentGameState));
    });

    for (let player of victims) {
        for (let i = 0; i < player.tokens.length; i++) {
            const visualPos = getVisualPosition(player.color, i, currentGameState, BOARD_CONFIG.cellSize * scale);
            if (visualPos) {
                const distance = Math.sqrt(Math.pow(x - visualPos.x, 2) + Math.pow(y - visualPos.y, 2));
                if (distance <= tokenRadius + 5) {
                    handleTokenSelection(i);
                    return;
                }
            }
        }
    }
};

/**
 * Check if color1 and color2 are teammates
 */
function isTeammateOf(color1, color2, gameState) {
    if (!gameState || !gameState.teamMode || !gameState.teams) return false;
    if (!color1 || !color2 || color1 === color2) return false;

    const { team1, team2 } = gameState.teams;
    if (team1.includes(color1) && team1.includes(color2)) return true;
    if (team2.includes(color1) && team2.includes(color2)) return true;

    return false;
}

/**
 * Check if player is finished
 */
function isPlayerFinished(playerId, gameState) {
    const player = gameState.players.find(p => p.id === playerId);
    return player && player.finishedTokens === 4;
}

/**
 * Handle token selection
 */
async function handleTokenSelection(tokenIndex) {
    try {
        await moveToken(tokenIndex);
    } catch (error) {
        console.error('Error moving token:', error);
        showNotification(error || 'Cannot move this token', 'error');
    }
}
