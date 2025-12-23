/**
 * Game Board Rendering - Classic Ludo Style
 * Handles canvas-based game board visualization and token interactions
 */

let canvas = null;
let ctx = null;
let currentGameState = null;
let selectedTokenIndex = null;

// Board configuration - Modern sleek design
const BOARD_CONFIG = {
    size: 600,
    cellSize: 40,
    tokenRadius: 18,
    colors: {
        red: '#FF3B5C',      // Vibrant red
        blue: '#4A90E2',     // Modern blue
        green: '#2ECC71',    // Fresh green
        yellow: '#F39C12'    // Warm yellow
    },
    gradients: {
        red: ['#FF3B5C', '#E91E63'],
        blue: ['#4A90E2', '#2980B9'],
        green: ['#2ECC71', '#27AE60'],
        yellow: ['#F39C12', '#E67E22']
    },
    boardBg: '#FAFAFA',
    pathColor: '#FFFFFF',
    pathBorder: '#34495E',
    safeColor: '#ECF0F1',
    homeColor: '#FFFFFF',
    debugMode: false // Hide position numbers for clean gameplay
};

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
    pathPositions[51] = { x: cellSize * 7.5, y: cellSize * 13.5 };

    // RED HOME STRETCH (52-56) - Positions after 51, going toward center
    pathPositions[52] = { x: cellSize * 7.5, y: cellSize * 12.5 }; // Red home 1
    pathPositions[53] = { x: cellSize * 7.5, y: cellSize * 11.5 }; // Red home 2
    pathPositions[54] = { x: cellSize * 7.5, y: cellSize * 10.5 }; // Red home 3
    pathPositions[55] = { x: cellSize * 7.5, y: cellSize * 9.5 };  // Red home 4
    pathPositions[56] = { x: cellSize * 7.5, y: cellSize * 8.5 };  // Red home 5 (last before center)

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

    const size = canvas.width;
    const scale = size / BOARD_CONFIG.size;

    ctx.fillStyle = BOARD_CONFIG.boardBg;
    ctx.fillRect(0, 0, size, size);

    drawClassicBoard(scale);

    gameState.players.forEach(player => {
        drawPlayerTokens(player, scale);
    });
};

function drawClassicBoard(scale) {
    const size = canvas.width;
    const cellSize = BOARD_CONFIG.cellSize * scale;

    // Draw home bases with proper spacing (starting at 0,0 for each corner)
    // Each home base is 6x6 cells
    drawHomeBase(0, 0, 'green', scale);
    drawHomeBase(size - cellSize * 6, 0, 'yellow', scale);
    drawHomeBase(0, size - cellSize * 6, 'red', scale);
    drawHomeBase(size - cellSize * 6, size - cellSize * 6, 'blue', scale);

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

    // Draw stars AFTER position numbers so they appear on top
    drawSafeZones(scale);
}

/**
 * Draw a home base with modern styling
 */
function drawHomeBase(x, y, color, scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const baseSize = cellSize * 6;

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, baseSize, baseSize);

    // Draw colored border
    ctx.strokeStyle = BOARD_CONFIG.colors[color];
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(x, y, baseSize, baseSize);

    // No token circles - tokens will be placed directly in the white space
    // Token positions will be calculated in getStartingAreaPosition
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
            { x: cellSize * 7.5, y: cellSize * 12.5 }, // 52
            { x: cellSize * 7.5, y: cellSize * 11.5 }, // 53
            { x: cellSize * 7.5, y: cellSize * 10.5 }, // 54
            { x: cellSize * 7.5, y: cellSize * 9.5 },  // 55
            { x: cellSize * 7.5, y: cellSize * 8.5 }   // 56
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
 * Draw safe zones (stars)
 * Stars mark safe positions where tokens cannot be captured
 * Safe positions: 0, 13, 21, 26, 34, 39, 47
 */
function drawSafeZones(scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const pathPositions = getPathPositions(cellSize);

    // Safe positions based on user's board layout
    const safePositionIndices = [0, 13, 21, 26, 34, 39, 47];

    safePositionIndices.forEach(position => {
        const pos = pathPositions[position];
        if (pos) {
            drawStar(pos.x, pos.y, cellSize * 0.5, '#FFD700', scale);
        }
    });
}

/**
 * Draw a star shape with enhanced visibility
 */
function drawStar(x, y, radius, color, scale) {
    // Draw star shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 2 * scale;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2.5 * scale;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius / 2;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
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
 * Draw player tokens with modern styling
 */
function drawPlayerTokens(player, scale) {
    const cellSize = BOARD_CONFIG.cellSize * scale;
    const tokenRadius = BOARD_CONFIG.tokenRadius * scale;

    player.tokens.forEach((token, index) => {
        const position = getTokenPosition(player.color, token, cellSize);

        if (position) {
            // Draw enhanced shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.arc(position.x + 2 * scale, position.y + 4 * scale, tokenRadius, 0, Math.PI * 2);
            ctx.fill();

            // Create gradient for token
            const gradient = ctx.createRadialGradient(
                position.x - tokenRadius * 0.3,
                position.y - tokenRadius * 0.3,
                tokenRadius * 0.1,
                position.x,
                position.y,
                tokenRadius
            );
            gradient.addColorStop(0, BOARD_CONFIG.gradients[player.color][0]);
            gradient.addColorStop(1, BOARD_CONFIG.gradients[player.color][1]);

            // Draw token with gradient
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(position.x, position.y, tokenRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw sleek border
            ctx.strokeStyle = '#2C3E50';
            ctx.lineWidth = 2.5 * scale;
            ctx.stroke();

            // Add glossy highlight
            const highlightGradient = ctx.createRadialGradient(
                position.x - tokenRadius * 0.4,
                position.y - tokenRadius * 0.4,
                0,
                position.x - tokenRadius * 0.4,
                position.y - tokenRadius * 0.4,
                tokenRadius * 0.6
            );
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.arc(position.x - tokenRadius * 0.3, position.y - tokenRadius * 0.3, tokenRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Highlight if movable with glow effect
            if (player.id === currentPlayerId && canMoveToken(player, index)) {
                // Outer glow
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15 * scale;
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.arc(position.x, position.y, tokenRadius + 4 * scale, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Inner glow ring
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.arc(position.x, position.y, tokenRadius + 2 * scale, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    });
}

/**
 * Get pixel position for a token
 */
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
        green: { x: center, y: cellSize * (1.5 + position) },
        yellow: { x: size - cellSize * (1.5 + position), y: center },
        red: { x: center, y: size - cellSize * (1.5 + position) },
        blue: { x: cellSize * (1.5 + position), y: center }
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
    if (currentGameState.currentPlayer.id !== player.id) return false;
    return true;
}

/**
 * Handle token click
 */
window.handleTokenClick = function (event) {
    if (!currentGameState || !currentGameState.lastDiceRoll) return;
    if (currentGameState.currentPlayer.id !== currentPlayerId) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const scale = canvas.width / BOARD_CONFIG.size;
    const tokenRadius = BOARD_CONFIG.tokenRadius * scale;

    const currentPlayer = currentGameState.players.find(p => p.id === currentPlayerId);
    if (!currentPlayer) return;

    for (let i = 0; i < currentPlayer.tokens.length; i++) {
        const token = currentPlayer.tokens[i];
        const position = getTokenPosition(currentPlayer.color, token, BOARD_CONFIG.cellSize * scale);

        if (position) {
            const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));

            if (distance <= tokenRadius + 5) {
                handleTokenSelection(i);
                return;
            }
        }
    }
};

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
