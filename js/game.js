/* ============================================
   Game — Main game logic with mode support
   Modes: zen, mirror, memory, numbers, timed
   ============================================ */

const Game = (() => {
    let currentLevel = null;
    let palette = [];
    let playerGrid = [];
    let originalGrid = [];
    let gridSize = 0;
    let startTime = 0;
    let hintsUsed = 0;
    let isPlaying = false;
    let activeMode = 'zen';

    const canvasOriginal = () => document.getElementById('canvas-original');
    const canvasPlayer = () => document.getElementById('canvas-player');

    // --- Start game with a specific mode ---
    function start(levelId, mode) {
        const level = Levels.getById(levelId);
        if (!level) return;

        activeMode = mode || Modes.getCurrent() || 'zen';
        Modes.setCurrent(activeMode);

        currentLevel = level;
        gridSize = level.size;
        originalGrid = level.grid;
        palette = Levels.getPalette(level.pack);
        hintsUsed = 0;
        startTime = Date.now();
        isPlaying = true;

        // Stop any previous timers
        Modes.stopTimer();
        Modes.cancelMemory();

        // Initialize empty player grid (-1 = empty)
        playerGrid = [];
        for (let y = 0; y < gridSize; y++) {
            playerGrid.push(new Array(gridSize).fill(-1));
        }

        // Init subsystems
        Tools.init();
        Palette.init(palette, onPaletteSelect, activeMode === 'numbers');

        // Set level name + mode badge
        const lang = I18n.getLang();
        const modeMeta = Modes.getMode(activeMode);
        const modeBadge = modeMeta ? `${modeMeta.icon} ` : '';
        document.getElementById('game-level-name').textContent =
            modeBadge + (level.name[lang] || level.name.ru || level.id);

        // Mode badge
        const badgeEl = document.getElementById('mode-badge');
        if (badgeEl && modeMeta) {
            badgeEl.textContent = modeMeta.icon + ' ' + (modeMeta.name[lang] || modeMeta.name.ru);
            badgeEl.style.display = '';
        } else if (badgeEl) {
            badgeEl.style.display = 'none';
        }

        // Show/hide mirror divider
        const mirrorLine = document.getElementById('mirror-line');
        if (mirrorLine) {
            mirrorLine.style.display = activeMode === 'mirror' ? 'block' : 'none';
        }

        // Render
        renderOriginal();
        renderPlayer();
        updateProgress();

        // Setup touch/click handlers on player canvas
        setupInput();
        // Setup tool buttons
        setupTools();

        // --- Mode-specific setup ---
        switch (activeMode) {
            case 'memory':
                startMemoryMode();
                break;
            case 'numbers':
                startNumbersMode();
                break;
            case 'timed':
                startTimedMode();
                break;
            case 'mirror':
                // Render mirror overlay on player canvas
                renderMirrorOverlay();
                break;
        }
    }

    // --- MEMORY MODE ---
    function startMemoryMode() {
        isPlaying = false; // Can't draw yet
        const origWrapper = document.getElementById('original-wrapper');
        origWrapper.classList.add('memory-visible');
        origWrapper.classList.remove('memory-hidden');

        const duration = Modes.getMemoryDuration(gridSize);
        Modes.setMemoryDuration(duration);

        // Show countdown overlay
        const countdownEl = document.getElementById('memory-countdown');
        if (countdownEl) {
            countdownEl.style.display = 'flex';
        }

        Modes.startMemoryPhase(() => {
            // Hide the original
            origWrapper.classList.remove('memory-visible');
            origWrapper.classList.add('memory-hidden');
            isPlaying = true;
            SFX.hint(); // Signal to start drawing
        });
    }

    // --- NUMBERS MODE ---
    function startNumbersMode() {
        // After rendering original, overlay numbers
        setTimeout(() => {
            const canvas = canvasOriginal();
            Modes.renderNumberOverlay(canvas, originalGrid, gridSize);
            // Also render numbers on player grid cells that are already filled
        }, 50);
    }

    // --- TIMED MODE ---
    function startTimedMode() {
        const limit = Modes.getTimerLimit(gridSize);
        Modes.startTimer(limit, null, () => {
            // Time's up!
            if (isPlaying) {
                isPlaying = false;
                SFX.error();
                Effects.shake(document.getElementById('game-canvases'));
                // Force check
                setTimeout(() => forceCheckResult(), 500);
            }
        });
    }

    // --- MIRROR: overlay showing drawable area ---
    function renderMirrorOverlay() {
        renderPlayer();
        // Draw a faint vertical line on the player canvas at the midpoint
        const canvas = canvasPlayer();
        const ctx = canvas.getContext('2d');
        const half = Math.ceil(gridSize / 2);
        const cellSize = canvas.width / gridSize;
        const lineX = half * cellSize;

        ctx.strokeStyle = 'rgba(226, 183, 20, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(lineX, 0);
        ctx.lineTo(lineX, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Shade the right half slightly
        ctx.fillStyle = 'rgba(226, 183, 20, 0.05)';
        ctx.fillRect(lineX, 0, canvas.width - lineX, canvas.height);
    }

    function onPaletteSelect(index, color) {
        if (Tools.getCurrent() === 'eyedropper') {
            Tools.setCurrent('pencil');
        }
    }

    // --- Rendering ---
    function renderOriginal() {
        CanvasRenderer.render(canvasOriginal(), originalGrid, palette, {
            showGrid: true,
        });
    }

    function renderPlayer() {
        const gridToRender = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;

        CanvasRenderer.render(canvasPlayer(), gridToRender, palette, {
            showGrid: true,
            checkerboard: true,
        });

        // Re-draw mirror line if in mirror mode
        if (activeMode === 'mirror') {
            const canvas = canvasPlayer();
            const ctx = canvas.getContext('2d');
            const half = Math.ceil(gridSize / 2);
            const cellSize = canvas.width / gridSize;
            const lineX = half * cellSize;
            ctx.strokeStyle = 'rgba(226, 183, 20, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(lineX, 0);
            ctx.lineTo(lineX, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
            // Light shade on right
            ctx.fillStyle = 'rgba(226, 183, 20, 0.04)';
            ctx.fillRect(lineX, 0, canvas.width - lineX, canvas.height);
        }
    }

    function renderPlayerWithHighlights(highlights) {
        const gridToRender = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;

        CanvasRenderer.render(canvasPlayer(), gridToRender, palette, {
            showGrid: true,
            checkerboard: true,
            highlightCells: highlights,
        });
    }

    function updateProgress() {
        // For mirror mode, compare the mirrored version
        const compareGrid = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;

        const progress = Scoring.getProgress(compareGrid, originalGrid);
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-text');
        fill.style.width = progress.correctPercent + '%';
        text.textContent = progress.correctPercent + '%';

        if (progress.correctPercent >= 100) {
            fill.style.background = 'var(--accent-primary)';
        } else if (progress.correctPercent >= 75) {
            fill.style.background = 'var(--accent-green)';
        } else {
            fill.style.background = 'var(--accent-tertiary)';
        }
    }

    // ---- Input handling ----
    let inputHandlersAttached = false;

    function setupInput() {
        const canvas = canvasPlayer();
        if (inputHandlersAttached) return;
        inputHandlersAttached = true;

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        let mouseDown = false;
        canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            handleDraw(e.clientX, e.clientY);
        });
        canvas.addEventListener('mousemove', (e) => {
            if (mouseDown) handleDraw(e.clientX, e.clientY);
        });
        canvas.addEventListener('mouseup', () => { mouseDown = false; });
        canvas.addEventListener('mouseleave', () => { mouseDown = false; });
    }

    let lastDrawnCell = null;

    function handleTouchStart(e) {
        e.preventDefault();
        if (!isPlaying) return;
        const touch = e.touches[0];
        lastDrawnCell = null;
        handleDraw(touch.clientX, touch.clientY);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!isPlaying) return;
        const touch = e.touches[0];
        handleDraw(touch.clientX, touch.clientY);
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        lastDrawnCell = null;
    }

    function handleDraw(clientX, clientY) {
        if (!isPlaying) return;
        const canvas = canvasPlayer();
        const pos = CanvasRenderer.getGridPos(canvas, clientX, clientY, gridSize);
        if (!pos) return;

        // Mirror mode: only allow drawing on left half
        if (activeMode === 'mirror' && !Modes.isMirrorDrawable(pos.x, gridSize)) {
            return;
        }

        if (lastDrawnCell && lastDrawnCell.x === pos.x && lastDrawnCell.y === pos.y) return;
        lastDrawnCell = pos;

        const tool = Tools.getCurrent();
        const selected = Palette.getSelected();

        switch (tool) {
            case 'pencil':
                drawPixel(pos.x, pos.y, selected.index);
                break;
            case 'eraser':
                erasePixel(pos.x, pos.y);
                break;
            case 'fill':
                fillArea(pos.x, pos.y, selected.index);
                break;
            case 'eyedropper':
                eyedrop(pos.x, pos.y);
                break;
        }
    }

    function drawPixel(x, y, colorIdx) {
        if (playerGrid[y][x] === colorIdx) return;
        Tools.pushUndo(playerGrid);
        playerGrid[y][x] = colorIdx;
        renderPlayer();
        updateProgress();

        SFX.pixelPlace(colorIdx);
        if (navigator.vibrate) navigator.vibrate(8);

        // Determine correct position for particles
        const compareGrid = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;

        if (originalGrid[y][x] === colorIdx) {
            const screenPos = CanvasRenderer.getCellScreenPos(canvasPlayer(), x, y, gridSize);
            Effects.pixelBurst(screenPos.x, screenPos.y, palette[colorIdx], 3);
        }

        // Mirror mode: also show particle on mirrored pixel if correct
        if (activeMode === 'mirror') {
            const mirrorX = gridSize - 1 - x;
            if (mirrorX !== x && originalGrid[y][mirrorX] === colorIdx) {
                const screenPos = CanvasRenderer.getCellScreenPos(canvasPlayer(), mirrorX, y, gridSize);
                Effects.pixelBurst(screenPos.x, screenPos.y, palette[colorIdx], 2);
            }
        }

        // Auto-check if 100%
        const progress = Scoring.getProgress(compareGrid, originalGrid);
        if (progress.correctPercent >= 100) {
            setTimeout(() => checkResult(), 300);
        }
    }

    function erasePixel(x, y) {
        if (playerGrid[y][x] === -1) return;
        Tools.pushUndo(playerGrid);
        playerGrid[y][x] = -1;
        renderPlayer();
        updateProgress();
        SFX.pixelErase();
    }

    function fillArea(x, y, colorIdx) {
        Tools.pushUndo(playerGrid);
        playerGrid = Tools.floodFill(playerGrid, x, y, colorIdx);
        renderPlayer();
        updateProgress();
        SFX.fill();
    }

    function eyedrop(x, y) {
        const colorIdx = playerGrid[y][x];
        if (colorIdx >= 0) {
            Palette.select(colorIdx);
            Tools.setCurrent('pencil');
        }
    }

    // ---- Tools bar ----
    function setupTools() {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.onclick = () => {
                const tool = btn.dataset.tool;
                if (tool === 'hint') {
                    useHint();
                } else if (tool === 'undo') {
                    performUndo();
                } else {
                    Tools.setCurrent(tool);
                }
            };
        });

        document.getElementById('btn-check').onclick = checkResult;
    }

    function performUndo() {
        const prev = Tools.undo();
        if (prev) {
            playerGrid = prev;
            renderPlayer();
            updateProgress();
        }
    }

    function useHint() {
        const compareGrid = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;

        const wrongOrEmpty = [];
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                // In mirror mode, only hint about drawable area
                if (activeMode === 'mirror' && !Modes.isMirrorDrawable(x, gridSize)) continue;
                if (compareGrid[y][x] !== originalGrid[y][x]) {
                    wrongOrEmpty.push({ x, y });
                }
            }
        }

        if (wrongOrEmpty.length === 0) {
            SFX.error();
            return;
        }

        hintsUsed++;
        const cell = wrongOrEmpty[Math.floor(Math.random() * wrongOrEmpty.length)];

        renderPlayerWithHighlights([{ x: cell.x, y: cell.y, color: '#e2b714' }]);
        SFX.hint();

        // In memory mode, briefly flash the original for that cell
        if (activeMode === 'memory') {
            const origWrapper = document.getElementById('original-wrapper');
            origWrapper.classList.remove('memory-hidden');
            origWrapper.classList.add('memory-visible');
            setTimeout(() => {
                origWrapper.classList.remove('memory-visible');
                origWrapper.classList.add('memory-hidden');
            }, 1500);
        }

        setTimeout(() => renderPlayer(), 2000);
    }

    function checkResult() {
        if (!isPlaying) return;
        forceCheckResult();
    }

    function forceCheckResult() {
        isPlaying = false;
        Modes.stopTimer();
        Modes.cancelMemory();

        // Unhide original if memory mode
        const origWrapper = document.getElementById('original-wrapper');
        if (origWrapper) {
            origWrapper.classList.remove('memory-hidden');
            origWrapper.classList.remove('memory-visible');
        }

        const elapsed = Date.now() - startTime;
        const compareGrid = activeMode === 'mirror'
            ? Modes.applyMirror(playerGrid, gridSize)
            : playerGrid;
        const result = Scoring.evaluate(compareGrid, originalGrid);

        if (result.stars === 0) {
            const highlights = [
                ...result.wrongCells.map(c => ({ ...c, color: '#ff6b6b' })),
                ...result.emptyCells.map(c => ({ ...c, color: '#f39c12' })),
            ];
            renderPlayerWithHighlights(highlights);
            Effects.shake(canvasPlayer().parentElement);
            SFX.error();

            setTimeout(() => {
                isPlaying = true;
                renderPlayer();
                // Re-setup mode if needed
                if (activeMode === 'timed') {
                    const limit = Modes.getTimerLimit(gridSize);
                    const elapsed = Modes.getTimerElapsed();
                    const remaining = limit - elapsed;
                    if (remaining > 0) {
                        // Timer still running — it was paused, restart it? No, don't restart
                    }
                }
            }, 1500);
            return;
        }

        // Mode bonus scoring
        let bonus = '';
        if (activeMode === 'memory') bonus = ' 🧠';
        if (activeMode === 'mirror') bonus = ' 🪞';
        if (activeMode === 'timed') bonus = ' ⏱';

        Storage.setLevelProgress(currentLevel.id, {
            stars: result.stars,
            completed: true,
            bestTime: elapsed,
        });

        showResult(result, elapsed, bonus);

        SFX.complete(result.stars);
        if (result.stars === 3) {
            Effects.fireworks();
            setTimeout(() => Effects.confetti(2000), 500);
        }
    }

    function showResult(result, elapsed, bonus = '') {
        const modal = document.getElementById('modal-result');
        const starsEl = document.getElementById('result-stars');
        const titleEl = document.getElementById('result-title');
        const statsEl = document.getElementById('result-stats');

        let starsHTML = '';
        for (let i = 0; i < 3; i++) {
            starsHTML += i < result.stars
                ? '<span>⭐</span>'
                : '<span class="star-empty">⭐</span>';
        }
        starsEl.innerHTML = starsHTML;

        titleEl.textContent = Scoring.getResultTitle(result.stars) + bonus;

        const lang = I18n.getLang();
        const modeMeta = Modes.getMode(activeMode);
        const modeName = modeMeta ? (modeMeta.name[lang] || modeMeta.name.ru) : '';

        statsEl.innerHTML = `
            ${I18n.t('result.accuracy')}: ${result.percentage}%<br>
            ${I18n.t('result.time')}: ${Scoring.formatTime(elapsed)}<br>
            ${I18n.t('result.hints')}: ${hintsUsed}<br>
            ${I18n.t('result.mode')}: ${modeName}
        `;

        modal.classList.add('active');

        document.getElementById('btn-retry').onclick = () => {
            modal.classList.remove('active');
            start(currentLevel.id, activeMode);
        };

        document.getElementById('btn-next').onclick = () => {
            modal.classList.remove('active');
            const next = Levels.getNextLevel(currentLevel.id);
            if (next) {
                start(next.id, activeMode);
            } else {
                App.showScreen('levels');
            }
        };
    }

    function getCurrentLevelId() {
        return currentLevel ? currentLevel.id : null;
    }

    return { start, getCurrentLevelId };
})();
