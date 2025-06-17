const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const cellSize = 30; // Size of each square cell in pixels

// maze dimensions and the grid
let mazeWidth;
let mazeHeight;
let grid = [];

// Player state
let player = 
{
    x: 0,
    y: 0,
    color: 'blue'
};

// End point state (red square)
let endPoint = 
{
    x: 0,
    y: 0,
    color: 'red'
};

// Game state
let gameWon = false;
let shortestPath = []; // Stores the calculated shortest path

let currentMoves = 0;
let leastMoves = 0; // This will be the shortest path length - 1

const leastMovesSpan = document.getElementById('leastMoves');
const currentMovesSpan = document.getElementById('currentMoves');

// Timer variables
let timeLeft = 120; // 2 minutes in seconds
let timerInterval;
// Changed this line to use 'countdown' instead of 'timerDisplay'
const timerDisplay = document.getElementById('countdown'); // Reference to your div with id="countdown"

// Maze Generation Algorithm (Depth-First Search)
function generateMazeDFS(startX, startY) 
{
    const stack = [];
    let current = grid[startY][startX];
    current.visited = true;
    stack.push(current);

    while (stack.length > 0)
   {
        current = stack.pop();

        const neighbors = [];
        // Check top neighbor
        if (current.y > 0 && !grid[current.y - 1][current.x].visited) 
        {
            neighbors.push(grid[current.y - 1][current.x]);
        }
        // Check right neighbor
        if (current.x < mazeWidth - 1 && !grid[current.y][current.x + 1].visited) 
        {
            neighbors.push(grid[current.y][current.x + 1]);
        }
        // Check bottom neighbor
        if (current.y < mazeHeight - 1 && !grid[current.y + 1][current.x].visited) 
        {
            neighbors.push(grid[current.y + 1][current.x]);
        }
        // Check left neighbor
        if (current.x > 0 && !grid[current.y][current.x - 1].visited) 
        {
            neighbors.push(grid[current.y][current.x - 1]);
        }

        if (neighbors.length > 0) 
        {
            stack.push(current); // Push current back to stack to backtrack later

            const next = neighbors[Math.floor(Math.random() * neighbors.length)]; // Pick a random unvisited neighbor

            // Remove walls between current and next cell
            if (next.y < current.y) { // Next is top
                current.walls.top = false;
                next.walls.bottom = false;
            } else if (next.y > current.y) { // Next is bottom
                current.walls.bottom = false;
                next.walls.top = false;
            } else if (next.x < current.x) { // Next is left
                current.walls.left = false;
                next.walls.right = false;
            } else if (next.x > current.x) { // Next is right
                current.walls.right = false;
                next.walls.left = false;
            }

            next.visited = true;
            stack.push(next);
        }
    }
}

//Shortest Path Algorithm (Breath first Srearch)
function findShortestPath(startCell, endCell) 
{
    // Reset visited status and parent for all cells before BFS
    for (let y = 0; y < mazeHeight; y++) 
    {
        for (let x = 0; x < mazeWidth; x++) 
        {
            grid[y][x].visited = false;
            grid[y][x].parent = null; // Store the parent cell to reconstruct path
        }
    }

    const queue = [];
    queue.push(startCell);
    startCell.visited = true;

    while (queue.length > 0) 
    {
        const current = queue.shift(); // Dequeue the first element

        if (current === endCell) 
        {
            // Path found! Reconstruct it
            const path = [];
            let temp = endCell;
            while (temp !== null) 
            {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse(); // Reverse to get path from start to end
        }

        // Get cells (top, right, bottom, left)
        const directions = [
            { dx: 0, dy: -1, wall: 'top' },    // Up
            { dx: 1, dy: 0, wall: 'right' },  // Right
            { dx: 0, dy: 1, wall: 'bottom' }, // Down
            { dx: -1, dy: 0, wall: 'left' }   // Left
        ];

        for (const dir of directions) 
        {
            const nextX = current.x + dir.dx;
            const nextY = current.y + dir.dy;

            // Check boundaries
            if (nextX >= 0 && nextX < mazeWidth && nextY >= 0 && nextY < mazeHeight)
           {
                const neighbor = grid[nextY][nextX];

                // Check if cell is not visited and there's no wall between current and neighbor
                const hasWall = current.walls[dir.wall];
                const oppositeWall = { 'top': 'bottom', 'right': 'left', 'bottom': 'top', 'left': 'right' };
                const neighborHasOppositeWall = neighbor.walls[oppositeWall[dir.wall]];

                if (!neighbor.visited && !hasWall && !neighborHasOppositeWall)
                {
                    neighbor.visited = true;
                    neighbor.parent = current; // Set current cell as parent
                    queue.push(neighbor);
                }
            }
        }
    }

    return null; // No path found
}

// Draws the maze walls
function drawMazeWalls() 
{
    ctx.strokeStyle = 'white'; // Color of the walls
    ctx.lineWidth = 2; // Thickness of the walls

    for (let y = 0; y < mazeHeight; y++) 
        {
        for (let x = 0; x < mazeWidth; x++) 
        {
            const cell = grid[y][x];
            const xPos = x * cellSize;
            const yPos = y * cellSize;

            // Draw walls
            if (cell.walls.top) 
            {
                ctx.beginPath();
                ctx.moveTo(xPos, yPos);
                ctx.lineTo(xPos + cellSize, yPos);
                ctx.stroke();
            }
            if (cell.walls.right)
            {
                ctx.beginPath();
                ctx.moveTo(xPos + cellSize, yPos);
                ctx.lineTo(xPos + cellSize, yPos + cellSize);
                ctx.stroke();
            }
            if (cell.walls.bottom) 
            {
                ctx.beginPath();
                ctx.moveTo(xPos + cellSize, yPos + cellSize);
                ctx.lineTo(xPos, yPos + cellSize);
                ctx.stroke();
            }
            if (cell.walls.left) 
            {
                ctx.beginPath();
                ctx.moveTo(xPos, yPos + cellSize);
                ctx.lineTo(xPos, yPos);
                ctx.stroke();
            }
        }
    }
}

// Draws the player (blue square)
function drawPlayer() 
{
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * cellSize, player.y * cellSize, cellSize, cellSize);
}

// Draws the end point (red square)
function drawEndPoint() 
{
    ctx.fillStyle = endPoint.color;
    ctx.fillRect(endPoint.x * cellSize, endPoint.y * cellSize, cellSize, cellSize);
}

// Draws the shortest path found by BFS
function drawPath() 
{
    if (!shortestPath || shortestPath.length === 0) return;


    ctx.lineWidth = cellSize / 4; // Line thickness
    ctx.lineCap = 'round'; // Round caps for joints

    ctx.beginPath();
    let first = true;
    for (const cell of shortestPath) 
    {
        const centerX = cell.x * cellSize + cellSize / 2;
        const centerY = cell.y * cellSize + cellSize / 2;
        if (first) 
        {
            ctx.moveTo(centerX, centerY);
            first = false;
        } else
        {
            ctx.lineTo(centerX, centerY);
        }
    }
    ctx.stroke();
    ctx.lineCap = 'butt'; // Reset line cap for other drawings
}

// function to refresh the canvas
function drawGame() 
{
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
    ctx.fillStyle = 'black'; // Set background to black
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with black
    drawMazeWalls(); // Redraw all maze walls

    // Draw end point (red square)
    drawEndPoint();

    // Draw player (blue square)
    drawPlayer();

    // Display win/lose message if game is won or time is up
    if (gameWon) 
    {
        ctx.fillStyle = 'green'; // Changed to green for win
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        ctx.fillText('YOU WIN!', textX, textY);
    } else if (timeLeft <= 0) 
    {
        ctx.fillStyle = 'Red';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        ctx.fillText('TIME UP! YOU LOSE!', textX, textY);
    }
}

// Checks if the player has reached the end point
function checkWinCondition() 
{
    if (player.x === endPoint.x && player.y === endPoint.y) 
    {
        gameWon = true;
        stopTimer(); // Stop the timer when the game is won

        if (shortestPath && shortestPath.length > 0) 
        {
            leastMovesSpan.textContent = shortestPath.length - 1;
        }

        // Remove event listeners to stop further movement
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('keyup', handleKeyRelease);
        drawGame(); // show "YOU WIN!" message
    }
}

// Function to handle player movement (called by keyboard)
function movePlayer(key) 
{
    if (gameWon || timeLeft <= 0) return; // Don't allow moves after winning or time runs out

    let newPlayerX = player.x;
    let newPlayerY = player.y;
    let moved = false;
    const currentCell = grid[player.y][player.x];

    // WASD key mapping
    switch (key) 
    {
        case 'w': // Up
            if (!currentCell.walls.top) 
            {
                newPlayerY--;
                moved = true;
            }
            break;
        case 's': // Down
            if (!currentCell.walls.bottom) 
            {
                newPlayerY++;
                moved = true;
            }
            break;
        case 'a': // Left
            if (!currentCell.walls.left) 
            {
                newPlayerX--;
                moved = true;
            }
            break;
        case 'd': // Right
            if (!currentCell.walls.right) 
            {
                newPlayerX++;
                moved = true;
            }
            break;
    }

    if (moved) 
    {
        player.x = newPlayerX;
        player.y = newPlayerY;
        currentMoves++; 
        currentMovesSpan.textContent = currentMoves; // Update display
        drawGame(); // Redraw the game scene after player moves
        checkWinCondition(); // Check if won after moving
    }
}

function handleKeyPress(event) 
{
    const allowedKeys = ['w', 'a', 's', 'd'];
    const pressedKey = event.key.toLowerCase();

    if (allowedKeys.includes(pressedKey)) 
    {
        event.preventDefault(); // Prevent default browser scrolling
        movePlayer(pressedKey);
    }
}

function handleKeyRelease(event) 
{

}

// Timer functions
function startTimer() 
{
    stopTimer(); // Clear any existing timer to prevent multiple timers running
    timerInterval = setInterval(() => 
    {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) 
        {
            stopTimer();
            endGameByTime();
        }
    }, 1000); // Update every second
}

function stopTimer() 
{
    clearInterval(timerInterval);
}

function updateTimerDisplay() 
{
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
   
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function endGameByTime() 
{
    gameWon = false; 
    window.removeEventListener('keydown', handleKeyPress);
    window.removeEventListener('keyup', handleKeyRelease);
    drawGame(); // Show the "TIME UP!" message
}

// Restart button 
const Restart = document.getElementById('Restart');

function RestartButtonClick() 
{
    window.location.reload(); 
}

if (Restart) 
{
    Restart.addEventListener('click', RestartButtonClick); 
} else 
{
    console.warn("Restart button with ID 'Restart' not found in the HTML. Ensure it exists!");
}

function initializeMazeAndGame() 
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    mazeWidth = Math.floor(canvas.width / cellSize);
    mazeHeight = Math.floor(canvas.height / cellSize);

    if (mazeWidth < 1) mazeWidth = 1;
    if (mazeHeight < 1) mazeHeight = 1;

    grid = [];
    for (let y = 0; y < mazeHeight; y++) 
    {
        grid[y] = [];
        for (let x = 0; x < mazeWidth; x++)
        {
            grid[y][x] = 
            {
                x: x,
                y: y,
                walls: { top: true, right: true, bottom: true, left: true },
                visited: false,
                parent: null
            };
        }
    }

    generateMazeDFS(0, 0);

    player.x = mazeWidth - 1;
    player.y = mazeHeight - 1;
    endPoint.x = 0;
    endPoint.y = 0;

    gameWon = false;
    timeLeft = 120; // Reset timer for new game
    updateTimerDisplay(); // Update display i

    // Calculate shortest path at the start of the game (from player start to new end point)
    shortestPath = findShortestPath(grid[player.y][player.x], grid[endPoint.y][endPoint.x]);
    if (shortestPath) 
    {
        leastMoves = shortestPath.length - 1; 
    } else 
    {
        leastMoves = 0; 
    }

    // Reset current moves and update display for both
    currentMoves = 0;
    if (currentMovesSpan) 
    {
        currentMovesSpan.textContent = currentMoves;
    }
    if (leastMovesSpan) 
    {
        leastMovesSpan.textContent = leastMoves;
    }

    window.removeEventListener('keydown', handleKeyPress);
    window.addEventListener('keydown', handleKeyPress);
    window.removeEventListener('keyup', handleKeyRelease);
    window.addEventListener('keyup', handleKeyRelease);

    drawGame(); // Draw maze
    startTimer(); // Start the timer 
}

initializeMazeAndGame();

window.addEventListener('resize', initializeMazeAndGame);


/* Reference List 

Devression.(2023).Maze Generation Game using HTML CSS JavaScript - SIMPLE TUTORIAL.https://www.youtube.com/watch?v=EN733Aq4ynM
The Coding Train.(2014).Coding Challenge #10.1: Maze Generator with p5.js - Part 1.https://www.youtube.com/watch?v=HyK_Q5rrcr4
javidx9.(2018).Programming Mazes.https://www.youtube.com/watch?v=Y37-gB83HKE
mattbatwings.(2024).What School Didn't Tell You About Mazes #SoMEpi.https://www.youtube.com/watch?v=uctN47p_KVk

*/