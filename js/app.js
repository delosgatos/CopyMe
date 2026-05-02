/* ============================================
   App — Main application controller
   ============================================ */

const App = (() => {
    let currentScreen = 'splash';

    function init() {
        // Initialize subsystems
        SFX.init();
        I18n.init();

        // Render splash demo
        renderSplashDemo();

        // Setup navigation
        document.getElementById('btn-start').onclick = () => {
            SFX.click();
            showScreen('levels');
            LevelSelect.init();
        };

        document.getElementById('btn-back-home').onclick = () => {
            SFX.click();
            showScreen('splash');
        };

        document.getElementById('btn-back-levels').onclick = () => {
            SFX.click();
            // Stop any running game modes
            Modes.stopTimer();
            Modes.cancelMemory();
            showScreen('levels');
            LevelSelect.refresh();
        };

        // Language switcher
        document.querySelectorAll('.btn-lang').forEach(btn => {
            btn.onclick = () => {
                const lang = btn.dataset.lang;
                I18n.setLang(lang);
                document.querySelectorAll('.btn-lang').forEach(b => {
                    b.classList.toggle('active', b.dataset.lang === lang);
                });
                SFX.click();
                // Refresh level select if visible
                if (currentScreen === 'levels') {
                    LevelSelect.refresh();
                }
            };
        });

        // Set initial lang buttons
        const lang = I18n.getLang();
        document.querySelectorAll('.btn-lang').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });

        console.log('🎨 CopyMe initialized!');
    }

    function showScreen(screenId) {
        currentScreen = screenId;
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });
        const screen = document.getElementById('screen-' + screenId);
        if (screen) {
            screen.classList.add('active');
        }
        // Close any open modals
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    function renderSplashDemo() {
        // Render a cute pixel art on the splash screen
        const canvas = document.createElement('canvas');
        const demoGrid = [
            [0,0,3,3,3,3,0,0],
            [0,3,7,7,7,7,3,0],
            [0,3,1,1,1,1,3,0],
            [0,3,1,0,0,1,3,0],
            [0,3,3,3,3,3,3,0],
            [3,3,4,3,3,4,3,3],
            [3,3,3,3,3,3,3,3],
            [0,3,3,3,3,3,3,0],
        ];
        const demoPalette = ['#000000', '#ffffff', '#f39c12', '#e74c3c', '#e2b714', '#2ecc71', '#3498db', '#ff69b4'];

        const container = document.getElementById('splash-demo');
        container.innerHTML = '';
        const size = 8;
        const cellSize = Math.floor(Math.min(container.clientWidth || 200, container.clientHeight || 200) / size);
        canvas.width = cellSize * size;
        canvas.height = cellSize * size;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.imageRendering = 'pixelated';

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                ctx.fillStyle = demoPalette[demoGrid[y][x]];
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        container.appendChild(canvas);

        // Animate — reveal pixels one by one
        animateSplashDemo(canvas, demoGrid, demoPalette, cellSize, size);
    }

    function animateSplashDemo(canvas, grid, palette, cellSize, size) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        // Clear
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Reveal pixels with animation
        const cells = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                cells.push({ x, y, color: palette[grid[y][x]] });
            }
        }
        // Shuffle for random reveal
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }

        let idx = 0;
        function drawNext() {
            if (idx >= cells.length) {
                // Restart after pause
                setTimeout(() => animateSplashDemo(canvas, grid, palette, cellSize, size), 2000);
                return;
            }
            const batch = Math.min(3, cells.length - idx);
            for (let b = 0; b < batch; b++) {
                const cell = cells[idx++];
                ctx.fillStyle = cell.color;
                ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
            }
            requestAnimationFrame(drawNext);
        }
        drawNext();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { showScreen, init };
})();
