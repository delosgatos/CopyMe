/* ============================================
   Modes — Game modes (Zen, Mirror, Memory, 
   ByNumbers, Timed, Random)
   ============================================ */

const Modes = (() => {
    const MODES = {
        zen: {
            id: 'zen',
            icon: '🧘',
            name: { ru: 'Дзен', en: 'Zen' },
            desc: { ru: 'Без таймера, расслабься и рисуй', en: 'No timer, relax and draw' },
            unlockLevel: 0, // always available
        },
        mirror: {
            id: 'mirror',
            icon: '🪞',
            name: { ru: 'Зеркало', en: 'Mirror' },
            desc: { ru: 'Рисуй половину — вторая отражается!', en: 'Draw half — the other mirrors!' },
            unlockLevel: 3, // after 3 levels completed
        },
        memory: {
            id: 'memory',
            icon: '🧠',
            name: { ru: 'По памяти', en: 'Memory' },
            desc: { ru: 'Запомни рисунок, потом нарисуй!', en: 'Memorize, then draw!' },
            unlockLevel: 5,
        },
        numbers: {
            id: 'numbers',
            icon: '🔢',
            name: { ru: 'По номерам', en: 'By Numbers' },
            desc: { ru: 'Каждый пиксель пронумерован', en: 'Each pixel is numbered' },
            unlockLevel: 2,
        },
        timed: {
            id: 'timed',
            icon: '⏱',
            name: { ru: 'На время', en: 'Timed' },
            desc: { ru: 'Уложись в таймер!', en: 'Beat the clock!' },
            unlockLevel: 8,
        },
    };

    let currentMode = 'zen';

    function getAll() { return MODES; }
    function getCurrent() { return currentMode; }
    function setCurrent(modeId) { currentMode = modeId; }

    function getMode(modeId) { return MODES[modeId]; }

    function isUnlocked(modeId) {
        const mode = MODES[modeId];
        if (!mode) return false;
        return Storage.getCompletedCount() >= mode.unlockLevel;
    }

    function getAvailableModes() {
        return Object.values(MODES).filter(m => isUnlocked(m.id));
    }

    // === MIRROR MODE ===
    // Returns mirrored grid: player draws left half, right mirrors
    function applyMirror(playerGrid, gridSize) {
        const mirrored = playerGrid.map(row => [...row]);
        const half = Math.ceil(gridSize / 2);
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < half; x++) {
                const mirrorX = gridSize - 1 - x;
                if (mirrorX !== x) {
                    mirrored[y][mirrorX] = mirrored[y][x];
                }
            }
        }
        return mirrored;
    }

    // Check if a cell is in the drawable area (left half for mirror)
    function isMirrorDrawable(x, gridSize) {
        return x < Math.ceil(gridSize / 2);
    }

    // === MEMORY MODE ===
    let memoryTimer = null;
    let memoryPhase = 'viewing'; // 'viewing' | 'drawing'
    let memoryDuration = 10000; // ms to view

    function getMemoryDuration(gridSize) {
        // More time for larger grids
        if (gridSize <= 8) return 8000;
        if (gridSize <= 12) return 12000;
        if (gridSize <= 16) return 18000;
        return 25000;
    }

    function startMemoryPhase(onHide) {
        memoryPhase = 'viewing';
        const duration = memoryDuration;
        
        // Show countdown on the original
        let remaining = Math.ceil(duration / 1000);
        const countdownEl = document.getElementById('memory-countdown');
        const numberEl = countdownEl ? countdownEl.querySelector('.countdown-number') : null;
        if (countdownEl) {
            countdownEl.style.display = 'flex';
            countdownEl.classList.remove('countdown-urgent');
        }
        if (numberEl) numberEl.textContent = remaining;
        
        const interval = setInterval(() => {
            remaining--;
            if (numberEl) numberEl.textContent = remaining;
            if (remaining <= 3 && countdownEl) {
                countdownEl.classList.add('countdown-urgent');
            }
        }, 1000);
        
        memoryTimer = setTimeout(() => {
            clearInterval(interval);
            memoryPhase = 'drawing';
            if (countdownEl) {
                countdownEl.style.display = 'none';
                countdownEl.classList.remove('countdown-urgent');
            }
            if (onHide) onHide();
        }, duration);
    }

    function cancelMemory() {
        if (memoryTimer) {
            clearTimeout(memoryTimer);
            memoryTimer = null;
        }
        memoryPhase = 'viewing';
    }

    function getMemoryPhase() { return memoryPhase; }
    function setMemoryDuration(ms) { memoryDuration = ms; }

    // === BY NUMBERS MODE ===
    // Render number overlay on the original canvas
    function renderNumberOverlay(canvas, grid, gridSize) {
        const ctx = canvas.getContext('2d');
        const cellSize = canvas.width / gridSize;
        
        ctx.font = `${Math.max(8, cellSize * 0.45)}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const colorIdx = grid[y][x];
                // Determine text color based on background brightness
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.strokeStyle = 'rgba(0,0,0,0.7)';
                ctx.lineWidth = 2;
                
                const cx = x * cellSize + cellSize / 2;
                const cy = y * cellSize + cellSize / 2;
                const text = String(colorIdx);
                ctx.strokeText(text, cx, cy);
                ctx.fillText(text, cx, cy);
            }
        }
    }

    // === TIMED MODE ===
    let timerInterval = null;
    let timerStartTime = 0;
    let timerLimit = 0;
    let timerCallback = null;

    function getTimerLimit(gridSize) {
        // Time limit based on grid size
        if (gridSize <= 8) return 60000;   // 1 min
        if (gridSize <= 12) return 120000;  // 2 min
        if (gridSize <= 16) return 180000;  // 3 min
        return 300000; // 5 min
    }

    function startTimer(limit, onTick, onExpire) {
        timerStartTime = Date.now();
        timerLimit = limit;
        timerCallback = onExpire;

        const timerEl = document.getElementById('game-timer');
        const timerValue = document.getElementById('timer-value');
        if (timerEl) timerEl.style.display = '';

        timerInterval = setInterval(() => {
            const elapsed = Date.now() - timerStartTime;
            const remaining = Math.max(0, timerLimit - elapsed);
            
            if (timerValue) {
                timerValue.textContent = Scoring.formatTime(remaining);
            }

            // Urgency coloring
            if (remaining < 10000 && timerValue) {
                timerValue.style.color = '#ff6b6b';
            } else if (remaining < 30000 && timerValue) {
                timerValue.style.color = '#f39c12';
            }

            if (onTick) onTick(remaining, elapsed);

            if (remaining <= 0) {
                stopTimer();
                if (timerCallback) timerCallback();
            }
        }, 100);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        const timerEl = document.getElementById('game-timer');
        if (timerEl) timerEl.style.display = 'none';
        const timerValue = document.getElementById('timer-value');
        if (timerValue) timerValue.style.color = '';
    }

    function getTimerElapsed() {
        return Date.now() - timerStartTime;
    }

    return {
        getAll, getCurrent, setCurrent, getMode, isUnlocked, getAvailableModes,
        // Mirror
        applyMirror, isMirrorDrawable,
        // Memory
        startMemoryPhase, cancelMemory, getMemoryPhase, setMemoryDuration, getMemoryDuration,
        // Numbers
        renderNumberOverlay,
        // Timer
        startTimer, stopTimer, getTimerLimit, getTimerElapsed,
    };
})();
