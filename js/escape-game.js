/* ============================================
   EscapeGame — Main game logic for Побег mode
   Draw path → run → chase → survive!
   ============================================ */

const EscapeGame = (() => {
    const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12 };
    
    // State
    let gameMode = 'escape';
    let level = null;
    let gridSize = 0;
    let grid = [];           // level grid (readonly)
    let pathGrid = [];       // player-drawn path (visit count per cell: 0, 1, 2, ...)
    let phase = 'draw';      // 'draw' | 'countdown' | 'run' | 'won' | 'lost'
    let runner = { x: 0, y: 0, visualX: 0, visualY: 0 };
    let chasers = [];
    let runnerPath = [];     // exact chronological path drawn
    let runnerIdx = 0;
    let hasKey = false;
    let coins = 0;
    let lives = 3;
    let animFrame = null;
    let runInterval = null;
    let chaserIntervals = [];
    let chaserDelayTimer = null;
    let startPos = { x: 0, y: 0 };
    let exitPos = { x: 0, y: 0 };
    let hasDrawn = false;
    let isDrawing = false;     // promoted to module scope for live mode
    let autoStartTimer = null; // auto-start countdown after first draw
    let autoStartSeconds = 0;  // remaining seconds
    let lastDrawTime = 0;      // timestamp of last draw (for live grace period)

    // Smooth interpolation
    let lerpQueue = [];      // runner positions to lerp to
    let chaserLerpQueues = []; // per-chaser lerp queues
    const LERP_SPEED = 8;    // cells per second for visual movement

    // Trail effect
    let runnerTrail = [];    // last N visual positions [{x,y,t}]
    const TRAIL_LENGTH = 6;
    let chaserTrails = [];   // per-chaser trails

    // Countdown
    let countdownValue = 0;  // 3, 2, 1, 0(GO)
    let countdownTimer = null;

    // Danger proximity
    let dangerLevel = 0;     // 0 = safe, 1 = max danger

    // Power-ups
    let activeEffects = { speed: 0, freeze: 0, ghost: 0 }; // timestamps when effect expires
    let originalRunnerSpeed = 0;

    // Ghost replay
    let ghostRecording = [];    // current run: [{x, y, t}]
    let ghostPlayback = null;   // saved best run from localStorage
    let ghostIdx = 0;           // current playback index
    let ghostPos = null;        // {x, y, visualX, visualY}
    let ghostInterval = null;
    let runStartTime = 0;       // when current run started

    const canvas = () => document.getElementById('escape-canvas');

    function getMode() { return gameMode; }

    function start(levelId, mode = 'escape', levelData = null) {
        gameMode = mode;
        if (levelData) {
            // Use provided level data directly (e.g. daily challenge)
            level = levelData;
        } else if (gameMode === 'live') {
            level = LiveLevels.getById(levelId);
        } else {
            level = EscapeLevels.getById(levelId);
        }
        if (!level) return;

        gridSize = level.size;
        grid = level.grid.map(row => [...row]);
        pathGrid = Array.from({ length: gridSize }, () => new Array(gridSize).fill(0));
        phase = 'draw';
        hasKey = false;
        coins = 0;
        lives = 3;
        runnerIdx = 0;
        runnerPath = [];
        chasers = [];
        hasDrawn = false;
        isDrawing = false;
        lastDrawTime = 0;
        if (autoStartTimer) { clearInterval(autoStartTimer); autoStartTimer = null; }

        // Find start and exit
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (grid[y][x] === C.START) {
                    startPos = { x, y };
                    runner = { x, y };
                    pathGrid[y][x] = 1;
                    runnerPath = [{ x, y }];
                }
                if (grid[y][x] === C.EXIT || grid[y][x] === C.DOOR) {
                    exitPos = { x, y };
                }
            }
        }

        // Update UI
        updateHeader();
        updateLives();
        updateCoins();

        // Show draw phase buttons
        const btnStart = document.getElementById('escape-btn-start');
        const btnClear = document.getElementById('escape-btn-clear');
        if (btnStart) { 
            btnStart.style.display = gameMode === 'live' ? 'none' : ''; 
            btnStart.disabled = false; 
        }
        if (btnClear) btnClear.style.display = '';
        
        const phaseLabel = document.getElementById('escape-phase');
        if (phaseLabel) {
            phaseLabel.textContent = gameMode === 'live' ? '⚡ Рисуй!' : '✏️';
        }

        // Setup input
        setupInput();
        
        if (animFrame) cancelAnimationFrame(animFrame);
        renderLoop();
    }

    let lastFrameTime = 0;
    function renderLoop(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05); // delta in seconds, cap at 50ms
        lastFrameTime = timestamp;

        // Interpolate runner visual position
        if (phase === 'run' || phase === 'won') {
            const speed = LERP_SPEED;
            const dx = runner.x - runner.visualX;
            const dy = runner.y - runner.visualY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.01) {
                const step = Math.min(speed * dt, dist);
                runner.visualX += (dx / dist) * step;
                runner.visualY += (dy / dist) * step;
            } else {
                runner.visualX = runner.x;
                runner.visualY = runner.y;
            }

            // Record trail
            runnerTrail.push({ x: runner.visualX, y: runner.visualY, t: Date.now() });
            if (runnerTrail.length > TRAIL_LENGTH * 4) runnerTrail = runnerTrail.slice(-TRAIL_LENGTH * 4);

            // Interpolate chasers
            for (let i = 0; i < chasers.length; i++) {
                const ch = chasers[i];
                if (ch.visualX === undefined) { ch.visualX = ch.x; ch.visualY = ch.y; }
                const cdx = ch.x - ch.visualX;
                const cdy = ch.y - ch.visualY;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist > 0.01) {
                    const cstep = Math.min(speed * 0.9 * dt, cdist);
                    ch.visualX += (cdx / cdist) * cstep;
                    ch.visualY += (cdy / cdist) * cstep;
                } else {
                    ch.visualX = ch.x;
                    ch.visualY = ch.y;
                }

                // Chaser trail
                if (!chaserTrails[i]) chaserTrails[i] = [];
                chaserTrails[i].push({ x: ch.visualX, y: ch.visualY, t: Date.now() });
                if (chaserTrails[i].length > TRAIL_LENGTH * 3) chaserTrails[i] = chaserTrails[i].slice(-TRAIL_LENGTH * 3);
            }

            // Calculate danger level
            let minDist = Infinity;
            for (const ch of chasers) {
                const d = Math.abs(ch.x - runner.x) + Math.abs(ch.y - runner.y);
                if (d < minDist) minDist = d;
            }
            // Danger: 0 at dist 6+, 1 at dist 0
            dangerLevel = Math.max(0, 1 - (minDist - 1) / 5);
            // Play heartbeat when danger is moderate+
            if (dangerLevel > 0.3) {
                SFX.heartbeat(dangerLevel);
            }
        } else {
            dangerLevel = 0;
        }

        render();
        animFrame = requestAnimationFrame(renderLoop);
    }

    function stop() {
        phase = 'draw';
        if (runInterval) { clearInterval(runInterval); runInterval = null; }
        chaserIntervals.forEach(i => clearInterval(i));
        chaserIntervals = [];
        if (chaserDelayTimer) { clearTimeout(chaserDelayTimer); chaserDelayTimer = null; }
        if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null; }
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
        if (ghostInterval) { clearInterval(ghostInterval); ghostInterval = null; }
    }

    // ---- Drawing Phase ----
    let inputSetup = false;
    function setupInput() {
        const c = canvas();
        if (inputSetup) return;
        inputSetup = true;

        c.addEventListener('mousedown', (e) => {
            if (phase !== 'draw' && !(gameMode === 'live' && phase === 'run')) return;
            isDrawing = true;
            hasDrawn = true;
            lastDrawTime = Date.now();
            handleDrawAt(e.clientX, e.clientY);
        });
        c.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            if (phase !== 'draw' && !(gameMode === 'live' && phase === 'run')) return;
            lastDrawTime = Date.now();
            handleDrawAt(e.clientX, e.clientY);
        });
        c.addEventListener('mouseup', () => { 
            isDrawing = false; 
        });
        c.addEventListener('mouseleave', () => { 
            isDrawing = false; 
        });

        c.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (phase !== 'draw' && !(gameMode === 'live' && phase === 'run')) return;
            isDrawing = true;
            hasDrawn = true;
            lastDrawTime = Date.now();
            handleDrawAt(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        c.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            if (phase !== 'draw' && !(gameMode === 'live' && phase === 'run')) return;
            lastDrawTime = Date.now();
            handleDrawAt(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        c.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDrawing = false;
        }, { passive: false });
    }

    let lastDrawGrid = null; // last grid coord drawn to, for interpolation
    let drawCellCount = 0;   // count cells drawn for vibration throttle

    function handleDrawAt(clientX, clientY) {
        const c = canvas();
        const rect = c.getBoundingClientRect();
        const scaleX = c.width / rect.width;
        const scaleY = c.height / rect.height;
        const px = (clientX - rect.left) * scaleX;
        const py = (clientY - rect.top) * scaleY;
        const cellSize = c.width / gridSize;
        const gx = Math.floor(px / cellSize);
        const gy = Math.floor(py / cellSize);

        if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return;

        // Interpolate between last touch point and current to fill gaps
        if (lastDrawGrid && (Math.abs(lastDrawGrid.x - gx) > 1 || Math.abs(lastDrawGrid.y - gy) > 1)) {
            // Bresenham-style: walk from last to current and try each cell
            const steps = Math.max(Math.abs(gx - lastDrawGrid.x), Math.abs(gy - lastDrawGrid.y));
            for (let s = 1; s <= steps; s++) {
                const ix = Math.round(lastDrawGrid.x + (gx - lastDrawGrid.x) * s / steps);
                const iy = Math.round(lastDrawGrid.y + (gy - lastDrawGrid.y) * s / steps);
                tryDrawCell(ix, iy);
            }
        } else {
            tryDrawCell(gx, gy);
        }

        lastDrawGrid = { x: gx, y: gy };
        render();
    }

    function tryDrawCell(gx, gy) {
        if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return;
        const cell = grid[gy][gx];
        if (cell === C.WALL) return;

        const lastCell = runnerPath[runnerPath.length - 1];
        const isAdjacent = Math.abs(lastCell.x - gx) + Math.abs(lastCell.y - gy) === 1;
        if (!isAdjacent) return;

        // Prevent immediate backtrack (undo-like ping-pong)
        if (runnerPath.length >= 2) {
            const prev = runnerPath[runnerPath.length - 2];
            if (prev.x === gx && prev.y === gy) return;
        }

        // Allow crossing! Increment visit count instead of blocking
        pathGrid[gy][gx] = (pathGrid[gy][gx] || 0) + 1;
        runnerPath.push({ x: gx, y: gy });
        SFX.pixelPlace(2);
        drawCellCount++;
        // Vibrate only every 3rd cell to avoid annoyance
        if (navigator.vibrate && drawCellCount % 3 === 0) navigator.vibrate(5);

        // Auto-start timer: begin countdown when first cell is drawn (non-live modes)
        if (runnerPath.length === 2 && gameMode !== 'live' && !autoStartTimer) {
            const drawTime = Math.min(12, 4 + Math.floor(gridSize / 2));
            autoStartSeconds = drawTime;
            const phaseLabel = document.getElementById('escape-phase');
            autoStartTimer = setInterval(() => {
                autoStartSeconds--;
                if (phaseLabel && phase === 'draw') {
                    phaseLabel.textContent = `✏️ ${autoStartSeconds}`;
                }
                if (autoStartSeconds <= 0) {
                    clearInterval(autoStartTimer);
                    autoStartTimer = null;
                    if (phase === 'draw') startRun();
                }
            }, 1000);
            if (phaseLabel) phaseLabel.textContent = `✏️ ${autoStartSeconds}`;
        }

        if (gameMode === 'live' && phase === 'draw') {
            startRun();
        }
    }

    function clearPath() {
        if (phase !== 'draw') return;
        pathGrid = Array.from({ length: gridSize }, () => new Array(gridSize).fill(0));
        // Keep start on path
        pathGrid[startPos.y][startPos.x] = 1;
        runnerPath = [{ ...startPos }];
        lastDrawGrid = null;
        drawCellCount = 0;
        // Reset auto-start timer
        if (autoStartTimer) { clearInterval(autoStartTimer); autoStartTimer = null; }
        autoStartSeconds = 0;
        const phaseLabel = document.getElementById('escape-phase');
        if (phaseLabel) phaseLabel.textContent = '✏️';
        SFX.undo();
    }

    function undoLastCell() {
        if (phase !== 'draw') return;
        if (runnerPath.length <= 1) return; // can't undo start
        const removed = runnerPath.pop();
        pathGrid[removed.y][removed.x] = Math.max(0, (pathGrid[removed.y][removed.x] || 0) - 1);
        lastDrawGrid = null;
        SFX.undo();
        render();
    }

    function erasePath() {
        // Switch to erase mode — toggle off
        // For simplicity, just clear everything
        clearPath();
    }

    // ---- Run Phase ----
    function startRun() {
        if (phase !== 'draw') return;

        // Stop auto-start timer if running
        if (autoStartTimer) { clearInterval(autoStartTimer); autoStartTimer = null; }

        if (runnerPath.length < 2 && gameMode !== 'live') {
            // Path too short — tell the user
            SFX.error();
            Effects.shake(canvas());
            const phaseLabel = document.getElementById('escape-phase');
            const lang = I18n.getLang();
            if (phaseLabel) phaseLabel.textContent = lang === 'en' ? '✏️ Draw path from 🐱!' : '✏️ Рисуй от 🐱!';
            setTimeout(() => {
                if (phaseLabel) phaseLabel.textContent = '✏️';
            }, 1500);
            return;
        }

        runner = { ...startPos, visualX: startPos.x, visualY: startPos.y };
        runnerIdx = 0;
        hasKey = false;
        chasers = [];
        runnerTrail = [];
        chaserTrails = [];
        chaserLerpQueues = [];
        dangerLevel = 0;
        activeEffects = { speed: 0, freeze: 0, ghost: 0 };
        originalRunnerSpeed = level.runnerSpeed;

        // Load ghost replay for this level
        ghostRecording = [];
        ghostPlayback = Storage.get('ghost_' + level.id, null);
        ghostIdx = 0;
        ghostPos = null;
        runStartTime = 0;
        if (ghostInterval) { clearInterval(ghostInterval); ghostInterval = null; }

        const btnStart = document.getElementById('escape-btn-start');
        const btnClear = document.getElementById('escape-btn-clear');
        if (btnStart) btnStart.disabled = true;
        if (btnClear) btnClear.style.display = 'none';

        // In live mode, skip countdown and start immediately
        if (gameMode === 'live') {
            phase = 'run';
            const phaseLabel = document.getElementById('escape-phase');
            if (phaseLabel) phaseLabel.textContent = '⚡';
            beginRunTimers();
            return;
        }

        // Countdown 3-2-1-GO!
        phase = 'countdown';
        countdownValue = 3;
        render();

        function tickCountdown() {
            if (countdownValue > 0) {
                SFX.click();
                if (navigator.vibrate) navigator.vibrate(30);
                render();
                countdownValue--;
                countdownTimer = setTimeout(tickCountdown, 700);
            } else {
                // GO!
                SFX.pixelPlace(5);
                if (navigator.vibrate) navigator.vibrate(50);
                phase = 'run';
                const phaseLabel = document.getElementById('escape-phase');
                if (phaseLabel) phaseLabel.textContent = '🏃';
                beginRunTimers();
            }
        }
        countdownTimer = setTimeout(tickCountdown, 400);
    }

    function beginRunTimers() {
        runStartTime = Date.now();
        ghostRecording = [{ x: runner.x, y: runner.y, t: 0 }];

        // Start runner
        runInterval = setInterval(() => {
            advanceRunner();
        }, level.runnerSpeed * 1.2);

        // Start ghost playback
        if (ghostPlayback && ghostPlayback.length > 1) {
            ghostIdx = 0;
            const gStart = ghostPlayback[0];
            ghostPos = { x: gStart.x, y: gStart.y, visualX: gStart.x, visualY: gStart.y };
            ghostInterval = setInterval(() => advanceGhost(), level.runnerSpeed * 1.2);
        }

        // Start chasers after delay
        chaserDelayTimer = setTimeout(() => {
            spawnChasers();
        }, level.chaserDelay);

        render();
    }

    function advanceRunner() {
        if (phase !== 'run') return;
        
        runnerIdx++;
        if (runnerIdx >= runnerPath.length) {
            // End of path — did we reach exit?
            const last = runnerPath[runnerPath.length - 1];
            if (last.x === exitPos.x && last.y === exitPos.y) {
                win();
            } else {
                // In live mode, wait for the player to draw more
                if (gameMode === 'live') {
                    // Grace period: wait up to 800ms after last touch before declaring dead end
                    const timeSinceLastDraw = Date.now() - lastDrawTime;
                    if (isDrawing || timeSinceLastDraw < 800) {
                        runnerIdx--; // revert so we check again next tick
                        return;
                    }
                }
                // Dead end!
                lose('deadend');
            }
            return;
        }

        const next = runnerPath[runnerIdx];
        runner.dx = next.x - runner.x;
        runner.dy = next.y - runner.y;
        runner.x = next.x;
        runner.y = next.y;
        SFX.pixelPlace(0);

        // Record for ghost
        ghostRecording.push({ x: runner.x, y: runner.y, t: Date.now() - runStartTime });

        // Check cell content
        const cell = grid[runner.y][runner.x];
        if (cell === C.TRAP) {
            lose('trap');
            return;
        }
        if (cell === C.KEY) {
            hasKey = true;
            grid[runner.y][runner.x] = C.EMPTY;
            SFX.hint();
        }
        if (cell === C.COIN) {
            coins++;
            grid[runner.y][runner.x] = C.EMPTY;
            updateCoins();
            SFX.pixelPlace(5);
        }
        // Power-ups
        if (cell === C.SPEED) {
            activeEffects.speed = Date.now() + 3000; // 3 sec
            grid[runner.y][runner.x] = C.EMPTY;
            SFX.hint();
            if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
            Achievements.recordPowerup('speed');
            // Temporarily speed up runner
            if (runInterval) clearInterval(runInterval);
            runInterval = setInterval(() => advanceRunner(), originalRunnerSpeed * 0.8);
            setTimeout(() => {
                if (phase === 'run' && runInterval) {
                    clearInterval(runInterval);
                    runInterval = setInterval(() => advanceRunner(), originalRunnerSpeed * 1.2);
                }
            }, 3000);
        }
        if (cell === C.FREEZE) {
            activeEffects.freeze = Date.now() + 2500; // 2.5 sec
            grid[runner.y][runner.x] = C.EMPTY;
            SFX.hint();
            if (navigator.vibrate) navigator.vibrate([50, 50]);
            Achievements.recordPowerup('freeze');
        }
        if (cell === C.GHOST) {
            activeEffects.ghost = Date.now() + 2500; // 2.5 sec
            grid[runner.y][runner.x] = C.EMPTY;
            SFX.hint();
            if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
            Achievements.recordPowerup('ghost');
        }
        if (cell === C.DOOR && !hasKey) {
            lose('locked');
            return;
        }
        if (cell === C.DOOR && hasKey) {
            win();
            return;
        }
        if (cell === C.EXIT) {
            win();
            return;
        }

        // Check chaser collision
        for (const ch of chasers) {
            if (ch.x === runner.x && ch.y === runner.y) {
                lose('caught');
                return;
            }
        }

        render();
    }

    function spawnChasers() {
        const numChasers = level.chasers || 1;
        
        // First chaser starts at start position
        chasers.push({ x: startPos.x, y: startPos.y, dx: 0, dy: 0 });
        
        // Second chaser from a different corner
        if (numChasers >= 2) {
            // Find a far corner
            const corners = [
                { x: 0, y: gridSize - 1 },
                { x: gridSize - 1, y: 0 },
                { x: 0, y: 0 },
            ];
            for (const corner of corners) {
                if (grid[corner.y][corner.x] !== C.WALL) {
                    chasers.push({ x: corner.x, y: corner.y, dx: 0, dy: 0 });
                    break;
                }
            }
        }

        // Each chaser follows the runner path
        chasers.forEach((ch, idx) => {
            const interval = setInterval(() => {
                advanceChaser(idx);
            }, level.chaserSpeed * 1.2);
            chaserIntervals.push(interval);
        });
    }

    function advanceChaser(chaserIdx) {
        if (phase !== 'run') return;
        const ch = chasers[chaserIdx];
        if (!ch) return;

        const now = Date.now();

        // Freeze: chasers don't move
        if (activeEffects.freeze > now) return;

        // Ghost: chasers wander randomly instead of chasing
        const isGhostActive = activeEffects.ghost > now;

        if (isGhostActive) {
            // Random wander on any passable cell
            const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
            const shuffled = dirs.sort(() => Math.random() - 0.5);
            for (const [dx, dy] of shuffled) {
                const nx = ch.x + dx, ny = ch.y + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize &&
                    grid[ny][nx] !== C.WALL) {
                    ch.dx = dx; ch.dy = dy;
                    ch.x = nx; ch.y = ny;
                    break;
                }
            }
        } else {
            // BFS to find shortest path to runner on any passable cell
            const nextStep = bfsNextStep(ch.x, ch.y, runner.x, runner.y);
            if (nextStep) {
                ch.dx = nextStep.x - ch.x;
                ch.dy = nextStep.y - ch.y;
                ch.x = nextStep.x;
                ch.y = nextStep.y;
            }
        }

        // Check collision
        if (ch.x === runner.x && ch.y === runner.y) {
            lose('caught');
            return;
        }
    }

    // BFS: find next step from (sx,sy) toward (tx,ty) on ANY passable cell
    function bfsNextStep(sx, sy, tx, ty) {
        if (sx === tx && sy === ty) return null;
        const visited = Array.from({ length: gridSize }, () => new Array(gridSize).fill(false));
        const parent = Array.from({ length: gridSize }, () => new Array(gridSize).fill(null));
        visited[sy][sx] = true;
        const queue = [{ x: sx, y: sy }];
        const dirs = [[0,1],[1,0],[0,-1],[-1,0]];

        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.x === tx && cur.y === ty) {
                // Trace back to find first step
                let step = cur;
                while (parent[step.y][step.x] && !(parent[step.y][step.x].x === sx && parent[step.y][step.x].y === sy)) {
                    step = parent[step.y][step.x];
                }
                return step;
            }
            for (const [dx, dy] of dirs) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
                if (visited[ny][nx]) continue;
                if (grid[ny][nx] === C.WALL) continue;
                // Chaser walks ANYWHERE except walls — no pathGrid restriction!
                visited[ny][nx] = true;
                parent[ny][nx] = { x: cur.x, y: cur.y };
                queue.push({ x: nx, y: ny });
            }
        }
        // No path found — shouldn't happen on valid maps
        return null;
    }

    function advanceGhost() {
        if (phase !== 'run' || !ghostPlayback) return;
        ghostIdx++;
        if (ghostIdx >= ghostPlayback.length) {
            // Ghost finished — stop
            if (ghostInterval) { clearInterval(ghostInterval); ghostInterval = null; }
            ghostPos = null;
            return;
        }
        const pt = ghostPlayback[ghostIdx];
        if (ghostPos) {
            ghostPos.dx = pt.x - ghostPos.x;
            ghostPos.dy = pt.y - ghostPos.y;
            ghostPos.x = pt.x;
            ghostPos.y = pt.y;
        }
    }

    // ---- Win / Lose ----
    function win() {
        phase = 'won';
        stop();
        SFX.complete(3);
        Effects.fireworks();
        setTimeout(() => Effects.confetti(1500), 300);

        // Track stats
        Storage.set('stat_wins', (Storage.get('stat_wins', 0) || 0) + 1);
        Storage.set('stat_games', (Storage.get('stat_games', 0) || 0) + 1);
        
        // Calculate stars
        let stars = 1;
        if (coins > 0) stars = 2;
        // All coins? Perfect path?
        const totalCoins = countTotalCoins();
        if (coins >= totalCoins) stars = 3;

        Storage.setEscapeProgress(level.id, { completed: true, stars, coins });

        // Save ghost recording if it's better (shorter path = better)
        const existing = Storage.get('ghost_' + level.id, null);
        if (!existing || ghostRecording.length < existing.length) {
            Storage.set('ghost_' + level.id, ghostRecording);
        }

        // Daily challenge streak
        let streakDays = 0;
        if (gameMode === 'daily') {
            const streak = DailyChallenge.completeToday();
            streakDays = streak.count;
        }

        // Award XP
        const xpResult = XPSystem.awardCompletion(stars, coins, gameMode === 'daily', streakDays);
        
        // Check achievements
        Achievements.checkSpeedDemon(runnerPath.length);
        Achievements.checkAll();

        // Show result (with XP info)
        setTimeout(() => showResult(stars, xpResult), 600);
        render();
    }

    function lose(reason) {
        phase = 'lost';
        stop();
        SFX.error();
        Effects.shake(canvas().parentElement);

        // Track stats
        Storage.set('stat_losses', (Storage.get('stat_losses', 0) || 0) + 1);
        Storage.set('stat_games', (Storage.get('stat_games', 0) || 0) + 1);
        const lang = I18n.getLang();
        const messages = {
            deadend: { ru: 'Тупик! 💀', en: 'Dead end! 💀' },
            trap: { ru: 'Ловушка! 🔥', en: 'Trap! 🔥' },
            caught: { ru: 'Поймали! 👹', en: 'Caught! 👹' },
            locked: { ru: 'Заперто! 🔒', en: 'Locked! 🔒' },
        };
        const msg = messages[reason] || messages.deadend;

        // Flash the reason
        const phaseLabel = document.getElementById('escape-phase');
        if (phaseLabel) phaseLabel.textContent = msg[lang] || msg.ru;

        if (gameMode === 'endless') {
            // Endless: game over — show result with wave count
            const wave = EndlessMode.getCurrentWave();
            const isNewRecord = EndlessMode.saveHighScore(wave);
            setTimeout(() => {
                const modal = document.getElementById('modal-escape-result');
                const starsEl = document.getElementById('escape-result-stars');
                const titleEl = document.getElementById('escape-result-title');
                const statsEl = document.getElementById('escape-result-stats');

                starsEl.innerHTML = '💀';
                titleEl.textContent = lang === 'en' ? 'Game Over!' : 'Игра окончена!';
                let stats = `♾️ ${lang === 'en' ? 'Wave reached' : 'Волна'}: <strong>${wave}</strong>`;
                stats += `<br>🪙 ${lang === 'en' ? 'Coins' : 'Монеты'}: ${EndlessMode.getTotalCoins()}`;
                if (isNewRecord) stats += `<br>🆕 ${lang === 'en' ? 'New Record!' : 'Новый рекорд!'}`;
                stats += `<br>🏆 ${lang === 'en' ? 'Best' : 'Лучшее'}: ${EndlessMode.getHighScore()}`;
                statsEl.innerHTML = stats;

                modal.classList.add('active');

                document.getElementById('escape-btn-retry').onclick = () => {
                    modal.classList.remove('active');
                    EndlessMode.reset();
                    const wave1 = EndlessMode.generateWave(1);
                    start(wave1.id, 'endless', wave1);
                };
                document.getElementById('escape-btn-next').onclick = () => {
                    modal.classList.remove('active');
                    App.showScreen('splash');
                };
            }, 800);
        } else {
            // Normal reset after delay
            setTimeout(() => {
                if (gameMode === 'daily') {
                    const dailyLevel = DailyChallenge.generateToday();
                    start(dailyLevel.id, 'daily', dailyLevel);
                } else {
                    start(level.id, gameMode);
                }
            }, 1800);
        }
    }

    function countTotalCoins() {
        let count = 0;
        for (const row of level.grid) {
            for (const cell of row) {
                if (cell === C.COIN) count++;
            }
        }
        return count;
    }

    function showResult(stars, xpResult) {
        const modal = document.getElementById('modal-escape-result');
        const starsEl = document.getElementById('escape-result-stars');
        const titleEl = document.getElementById('escape-result-title');
        const statsEl = document.getElementById('escape-result-stats');
        const lang = I18n.getLang();

        let starsHTML = '';
        for (let i = 0; i < 3; i++) {
            starsHTML += i < stars ? '<span>⭐</span>' : '<span class="star-empty">⭐</span>';
        }
        starsEl.innerHTML = starsHTML;

        const titles = {
            1: { ru: 'Спаслись! 😅', en: 'Escaped! 😅' },
            2: { ru: 'Отлично! 🎉', en: 'Great! 🎉' },
            3: { ru: 'Идеально! 🏆', en: 'Perfect! 🏆' },
        };
        titleEl.textContent = (titles[stars] || titles[1])[lang] || (titles[stars] || titles[1]).ru;

        const totalCoins = countTotalCoins();
        let statsHTML = `🪙 ${lang === 'en' ? 'Coins' : 'Монеты'}: ${coins}/${totalCoins}`;

        // XP info
        if (xpResult) {
            statsHTML += `<br>✨ +${xpResult.added} XP`;
            if (xpResult.leveledUp) {
                const lvlName = xpResult.level.name[lang] || xpResult.level.name.ru;
                statsHTML += `<br>🎖 ${lang === 'en' ? 'Rank up:' : 'Новый ранг:'} <strong>${lvlName}</strong>`;
            }
        }
        // Endless wave info
        if (gameMode === 'endless') {
            const wave = EndlessMode.getCurrentWave();
            EndlessMode.addCoins(coins);
            const isNewRecord = EndlessMode.saveHighScore(wave);
            statsHTML += `<br>♾️ ${lang === 'en' ? 'Wave' : 'Волна'}: ${wave}`;
            if (isNewRecord) {
                statsHTML += ` <strong>🆕</strong>`;
            }
        }
        statsEl.innerHTML = statsHTML;

        modal.classList.add('active');

        document.getElementById('escape-btn-retry').onclick = () => {
            modal.classList.remove('active');
            if (gameMode === 'endless') {
                // Restart from wave 1
                EndlessMode.reset();
                const wave1 = EndlessMode.generateWave(1);
                start(wave1.id, 'endless', wave1);
            } else if (gameMode === 'daily') {
                const dailyLevel = DailyChallenge.generateToday();
                start(dailyLevel.id, 'daily', dailyLevel);
            } else {
                start(level.id, gameMode);
            }
        };

        document.getElementById('escape-btn-next').onclick = () => {
            modal.classList.remove('active');
            if (gameMode === 'endless') {
                // Next wave
                const nextWave = EndlessMode.getCurrentWave() + 1;
                const waveLevel = EndlessMode.generateWave(nextWave);
                start(waveLevel.id, 'endless', waveLevel);
            } else if (gameMode === 'daily') {
                // Daily has no "next" — return to splash
                App.showScreen('splash');
            } else if (gameMode === 'live') {
                const next = LiveLevels.getNext(level.id);
                if (next) {
                    start(next.id, 'live');
                } else {
                    App.showScreen('live-levels');
                    LiveLevelSelect.refresh();
                }
            } else {
                const next = EscapeLevels.getNext(level.id);
                if (next) {
                    start(next.id, 'escape');
                } else {
                    App.showScreen('escape-levels');
                    EscapeLevelSelect.refresh();
                }
            }
        };
    }

    // ---- Rendering ----
    function render() {
        const c = canvas();
        if (!c) return;
        const wrapper = c.parentElement;
        const maxW = wrapper.clientWidth - 4;
        const maxH = wrapper.clientHeight - 4;
        const cs = Math.floor(Math.min(maxW, maxH) / gridSize);
        const totalSize = cs * gridSize;

        c.width = totalSize;
        c.height = totalSize;
        c.style.width = totalSize + 'px';
        c.style.height = totalSize + 'px';

        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Color scheme
        const colors = {
            empty: '#0f0e17',
            wall: '#2a2a4a',
            path: '#1a3a2a',
            pathBorder: '#22c55e',
            trap: '#3a1a1a',
            trapIcon: '🔥',
            key: '#3a3a1a',
            keyIcon: '🔑',
            coin: '#2a2a1a',
            coinIcon: '🪙',
            door: '#2a1a2a',
            doorIcon: '🚪',
            start: '#1a2a3a',
            exit: '#1a3a1a',
            exitIcon: '🚪',
            startIcon: '🏠',
            runner: '🐱',
            chaser: '👹',
        };

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = grid[y][x];
                const visitCount = pathGrid[y][x] || 0;
                const isPath = visitCount > 0;

                // Base color
                let bgColor = colors.empty;
                if (cell === C.WALL)  bgColor = colors.wall;
                else if (isPath && visitCount >= 2) bgColor = '#1a4a4a'; // crossing: cyan tint
                else if (isPath)      bgColor = colors.path;
                else if (cell === C.TRAP)  bgColor = colors.trap;
                else if (cell === C.KEY)   bgColor = colors.key;
                else if (cell === C.COIN)  bgColor = colors.coin;
                else if (cell === C.DOOR)  bgColor = colors.door;
                else if (cell === C.START) bgColor = colors.start;
                else if (cell === C.EXIT)  bgColor = colors.exit;

                // Checkerboard for empty
                if (!isPath && cell === C.EMPTY) {
                    const isLight = (x + y) % 2 === 0;
                    bgColor = isLight ? '#12111f' : '#0f0e17';
                }

                ctx.fillStyle = bgColor;
                ctx.fillRect(x * cs, y * cs, cs, cs);

                // Path highlight border
                if (isPath && cell !== C.WALL) {
                    const borderColor = visitCount >= 2 ? 'rgba(34, 211, 238, 0.5)' : 'rgba(34, 197, 94, 0.4)';
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
                }

                // Drawable neighbor glow (only in draw phase, or live run)
                // Now shows on ALL non-wall cells including already-drawn ones (for crossing)
                if ((phase === 'draw' || (gameMode === 'live' && phase === 'run')) && cell !== C.WALL) {
                    const lastCell = runnerPath[runnerPath.length - 1];
                    if (lastCell) {
                        const isAdj = Math.abs(lastCell.x - x) + Math.abs(lastCell.y - y) === 1;
                        // Don't glow the cell we just came from (anti-backtrack)
                        const isPrev = runnerPath.length >= 2 && runnerPath[runnerPath.length - 2].x === x && runnerPath[runnerPath.length - 2].y === y;
                        if (isAdj && !isPrev) {
                            ctx.fillStyle = isPath ? 'rgba(34, 211, 238, 0.12)' : 'rgba(34, 197, 94, 0.08)';
                            ctx.fillRect(x * cs, y * cs, cs, cs);
                            ctx.strokeStyle = isPath ? 'rgba(34, 211, 238, 0.2)' : 'rgba(34, 197, 94, 0.15)';
                            ctx.lineWidth = 1;
                            ctx.setLineDash([3, 3]);
                            ctx.strokeRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
                            ctx.setLineDash([]);
                        }
                    }
                }

                // Wall 3D effect
                if (cell === C.WALL) {
                    ctx.fillStyle = 'rgba(255,255,255,0.05)';
                    ctx.fillRect(x * cs, y * cs, cs, 2);
                    ctx.fillRect(x * cs, y * cs, 2, cs);
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(x * cs + cs - 2, y * cs, 2, cs);
                    ctx.fillRect(x * cs, y * cs + cs - 2, cs, 2);
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cs + 0.5, 0);
            ctx.lineTo(i * cs + 0.5, totalSize);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cs + 0.5);
            ctx.lineTo(totalSize, i * cs + 0.5);
            ctx.stroke();
        }

        // Draw icons (emoji)
        const fontSize = Math.max(12, cs * 0.65);
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = grid[y][x];
                const cx = x * cs + cs / 2;
                const cy = y * cs + cs / 2;
                let icon = null;

                if (cell === C.TRAP)  icon = colors.trapIcon;
                if (cell === C.KEY)   icon = colors.keyIcon;
                if (cell === C.COIN)  icon = colors.coinIcon;
                if (cell === C.DOOR)  icon = hasKey ? '🚪' : '🔒';
                if (cell === C.EXIT)  icon = colors.exitIcon;
                if (cell === C.START && !(runner.x === x && runner.y === y)) icon = colors.startIcon;
                if (cell === C.SPEED) icon = '⚡';
                if (cell === C.FREEZE) icon = '❄️';
                if (cell === C.GHOST) icon = '👻';

                if (icon) {
                    // Power-ups get a subtle glow
                    if (cell === C.SPEED || cell === C.FREEZE || cell === C.GHOST) {
                        const pulse = (Math.sin(Date.now() / 300 + x + y) + 1) / 2;
                        ctx.save();
                        ctx.shadowColor = cell === C.SPEED ? '#f59e0b' : cell === C.FREEZE ? '#3b82f6' : '#a855f7';
                        ctx.shadowBlur = 6 + pulse * 6;
                        ctx.fillText(icon, cx, cy);
                        ctx.restore();
                    } else {
                        ctx.fillText(icon, cx, cy);
                    }
                }
            }
        }

        // Time for animation
        const time = Date.now();
        const mouthOpen = (Math.sin(time / 100) + 1) / 2; // 0 to 1
        const mouthAngle = mouthOpen * 0.5; // up to 0.5 radians

        // Helper to draw a Pac-Man entity
        function drawPacman(x, y, dx, dy, color, isCat) {
            let angle = 0;
            if (dx > 0) angle = 0;
            else if (dx < 0) angle = Math.PI;
            else if (dy > 0) angle = Math.PI / 2;
            else if (dy < 0) angle = -Math.PI / 2;

            const skin = isCat ? CatSkins.getActiveSkin() : null;
            const bodyColor = isCat ? skin.body : color;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Glow effect for high-tier skins
            if (isCat && skin.glow) {
                const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
                ctx.shadowColor = skin.glow;
                ctx.shadowBlur = 8 + pulse * 8;
            }

            // Draw body
            ctx.beginPath();
            ctx.arc(0, 0, cs * 0.4, mouthAngle, Math.PI * 2 - mouthAngle);
            ctx.lineTo(0, 0);
            ctx.fillStyle = bodyColor;
            ctx.fill();

            // Stripes for tiger skin
            if (isCat && skin.stripes) {
                ctx.fillStyle = skin.stripeColor;
                for (let s = -2; s <= 2; s++) {
                    ctx.fillRect(-cs * 0.15 + s * cs * 0.12, -cs * 0.35, cs * 0.04, cs * 0.7);
                }
                // Redraw body outline to clip stripes
                ctx.beginPath();
                ctx.arc(0, 0, cs * 0.4, mouthAngle, Math.PI * 2 - mouthAngle);
                ctx.lineTo(0, 0);
                ctx.strokeStyle = bodyColor;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            ctx.shadowBlur = 0;

            if (isCat) {
                // Ears
                ctx.fillStyle = skin.ear;
                ctx.beginPath();
                ctx.moveTo(0, -cs * 0.15);
                ctx.lineTo(-cs * 0.35, -cs * 0.45);
                ctx.lineTo(-cs * 0.25, -cs * 0.05);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, cs * 0.15);
                ctx.lineTo(-cs * 0.35, cs * 0.45);
                ctx.lineTo(-cs * 0.25, cs * 0.05);
                ctx.fill();

                // Inner ear
                ctx.fillStyle = skin.earInner;
                ctx.beginPath();
                ctx.moveTo(-cs * 0.05, -cs * 0.18);
                ctx.lineTo(-cs * 0.28, -cs * 0.38);
                ctx.lineTo(-cs * 0.22, -cs * 0.1);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-cs * 0.05, cs * 0.18);
                ctx.lineTo(-cs * 0.28, cs * 0.38);
                ctx.lineTo(-cs * 0.22, cs * 0.1);
                ctx.fill();

                // Crown for legend skin
                if (skin.crown) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.beginPath();
                    ctx.moveTo(-cs * 0.3, -cs * 0.35);
                    ctx.lineTo(-cs * 0.45, -cs * 0.6);
                    ctx.lineTo(-cs * 0.35, -cs * 0.45);
                    ctx.lineTo(-cs * 0.25, -cs * 0.65);
                    ctx.lineTo(-cs * 0.15, -cs * 0.45);
                    ctx.lineTo(-cs * 0.05, -cs * 0.6);
                    ctx.lineTo(0, -cs * 0.35);
                    ctx.fill();
                }

                // Eye
                ctx.fillStyle = skin.eye;
                ctx.beginPath();
                ctx.arc(cs * 0.05, -cs * 0.2, cs * 0.12, 0, Math.PI * 2);
                ctx.fill();
                // Cat pupil (slit)
                ctx.fillStyle = skin.pupil;
                ctx.beginPath();
                ctx.ellipse(cs * 0.05, -cs * 0.2, cs * 0.03, cs * 0.08, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Whiskers
                ctx.strokeStyle = skin.whiskerColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cs * 0.1, 0); ctx.lineTo(cs * 0.4, -cs * 0.1);
                ctx.moveTo(cs * 0.1, 0); ctx.lineTo(cs * 0.4, cs * 0.1);
                ctx.stroke();
            } else {
                // Draw angry eye for chaser
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(0, -cs * 0.2, cs * 0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(cs * 0.03, -cs * 0.2, cs * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Draw runner trail
        if ((phase === 'run' || phase === 'won') && runnerTrail.length > 1) {
            const now = Date.now();
            const skinTrail = CatSkins.getActiveSkin().trailColor;
            for (let i = 0; i < runnerTrail.length; i++) {
                const t = runnerTrail[i];
                const age = now - t.t;
                if (age > 400) continue; // only show last 400ms
                const alpha = Math.max(0, 0.3 * (1 - age / 400));
                ctx.fillStyle = skinTrail.replace('ALPHA', alpha.toFixed(3));
                const size = cs * 0.3 * (1 - age / 400);
                ctx.beginPath();
                ctx.arc(t.x * cs + cs / 2, t.y * cs + cs / 2, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw chaser trails
        for (let ci = 0; ci < chasers.length; ci++) {
            const trail = chaserTrails[ci] || [];
            const now = Date.now();
            for (let i = 0; i < trail.length; i++) {
                const t = trail[i];
                const age = now - t.t;
                if (age > 350) continue;
                const alpha = Math.max(0, 0.25 * (1 - age / 350));
                ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
                const size = cs * 0.25 * (1 - age / 350);
                ctx.beginPath();
                ctx.arc(t.x * cs + cs / 2, t.y * cs + cs / 2, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw ghost replay (translucent best-run cat)
        if (ghostPos && phase === 'run') {
            const gx = ghostPos.x * cs + cs / 2;
            const gy = ghostPos.y * cs + cs / 2;
            ctx.save();
            ctx.globalAlpha = 0.25;
            // Draw a simple circle ghost (not full cat to distinguish)
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(gx, gy, cs * 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Ghost label
            ctx.font = `${Math.max(8, cs * 0.3)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText('👻', gx, gy);
            ctx.restore();
        }

        // Draw runner (Cat Pac-Man) — use visual position for smooth movement
        if (phase === 'run' || phase === 'draw' || phase === 'won' || phase === 'countdown') {
            const vx = (phase === 'run' || phase === 'won') ? runner.visualX : runner.x;
            const vy = (phase === 'run' || phase === 'won') ? runner.visualY : runner.y;
            const rx = vx * cs + cs / 2;
            const ry = vy * cs + cs / 2;
            drawPacman(rx, ry, runner.dx || 1, runner.dy || 0, '#f39c12', true);
        }

        // Draw chasers (Monster Pac-Man) — use visual position
        for (const ch of chasers) {
            const vx = ch.visualX !== undefined ? ch.visualX : ch.x;
            const vy = ch.visualY !== undefined ? ch.visualY : ch.y;
            const chx = vx * cs + cs / 2;
            const chy = vy * cs + cs / 2;
            drawPacman(chx, chy, ch.dx || -1, ch.dy || 0, '#e74c3c', false);
        }

        // Danger vignette overlay
        if (dangerLevel > 0 && phase === 'run') {
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // 0-1 pulsing
            const intensity = dangerLevel * (0.15 + pulse * 0.15);
            const grad = ctx.createRadialGradient(
                totalSize / 2, totalSize / 2, totalSize * 0.3,
                totalSize / 2, totalSize / 2, totalSize * 0.7
            );
            grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
            grad.addColorStop(1, `rgba(200, 0, 0, ${intensity})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, totalSize, totalSize);

            // Vibrate when very close
            if (dangerLevel > 0.7 && navigator.vibrate) {
                navigator.vibrate(10);
            }
        }

        // Power-up active effects overlay
        const now = Date.now();
        if (activeEffects.speed > now && phase === 'run') {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
            ctx.fillRect(0, 0, totalSize, totalSize);
            // Speed indicator in corner
            ctx.font = `${Math.max(14, cs * 0.5)}px serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const remaining = ((activeEffects.speed - now) / 1000).toFixed(1);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`⚡ ${remaining}s`, 4, 4);
        }
        if (activeEffects.freeze > now && phase === 'run') {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
            ctx.fillRect(0, 0, totalSize, totalSize);
            ctx.font = `${Math.max(14, cs * 0.5)}px serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const remaining = ((activeEffects.freeze - now) / 1000).toFixed(1);
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(`❄️ ${remaining}s`, 4, activeEffects.speed > now ? 24 : 4);
        }
        if (activeEffects.ghost > now && phase === 'run') {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
            ctx.fillRect(0, 0, totalSize, totalSize);
            ctx.font = `${Math.max(14, cs * 0.5)}px serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const remaining = ((activeEffects.ghost - now) / 1000).toFixed(1);
            ctx.fillStyle = '#a855f7';
            let yOff = 4;
            if (activeEffects.speed > now) yOff += 20;
            if (activeEffects.freeze > now) yOff += 20;
            ctx.fillText(`👻 ${remaining}s`, 4, yOff);
        }

        // Fog of War — only on large grids in live/daily modes during run
        const fogEnabled = (gameMode === 'live' || gameMode === 'daily') && gridSize >= 10 && (phase === 'run');
        if (fogEnabled) {
            const vx = runner.visualX * cs + cs / 2;
            const vy = runner.visualY * cs + cs / 2;
            const fogRadius = cs * 3.5; // visible radius around runner

            // Save the current canvas, then draw fog
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';

            // Create fog layer
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, totalSize, totalSize);

            // Cut out circle around runner (erase fog)
            ctx.globalCompositeOperation = 'destination-out';
            const fogGrad = ctx.createRadialGradient(vx, vy, fogRadius * 0.3, vx, vy, fogRadius);
            fogGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            fogGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
            fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = fogGrad;
            ctx.fillRect(0, 0, totalSize, totalSize);

            // Also slightly reveal drawn path cells
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let py = 0; py < gridSize; py++) {
                for (let px = 0; px < gridSize; px++) {
                    if (pathGrid[py][px]) {
                        ctx.fillRect(px * cs, py * cs, cs, cs);
                    }
                }
            }

            ctx.restore();
        }

        // Countdown overlay
        if (phase === 'countdown') {
            // Dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, totalSize, totalSize);

            // Countdown number
            const labels = { 3: '3', 2: '2', 1: '1', 0: 'GO!' };
            const colors321 = { 3: '#22c55e', 2: '#e2b714', 1: '#e74c3c', 0: '#f39c12' };
            const label = labels[countdownValue] || '';
            const fontSize = Math.min(totalSize * 0.3, 120);
            ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Glow effect
            ctx.shadowColor = colors321[countdownValue] || '#fff';
            ctx.shadowBlur = 30;
            ctx.fillStyle = colors321[countdownValue] || '#fff';
            ctx.fillText(label, totalSize / 2, totalSize / 2);
            ctx.shadowBlur = 0;
        }
    }

    // ---- UI Updates ----
    function updateHeader() {
        const nameEl = document.getElementById('escape-level-name');
        if (nameEl) {
            const lang = I18n.getLang();
            nameEl.textContent = level.name[lang] || level.name.ru;
        }
    }

    function updateLives() {
        const el = document.getElementById('escape-lives');
        if (el) el.textContent = '❤️'.repeat(lives);
    }

    function updateCoins() {
        const el = document.getElementById('escape-coins');
        if (el) el.textContent = '🪙 ' + coins;
    }

    return { start, stop, startRun, clearPath, undoLastCell, getMode };
})();
