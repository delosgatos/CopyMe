/* ============================================
   EscapeLevelSelect — Level grid for Побег
   ============================================ */

const EscapeLevelSelect = (() => {
    function init() {
        renderLevels();
    }

    // Draw a tiny maze preview onto a canvas
    function drawMazePreview(canvasEl, level) {
        const size = level.size;
        const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12 };
        const px = Math.max(2, Math.floor(48 / size));
        const totalPx = px * size;
        canvasEl.width = totalPx;
        canvasEl.height = totalPx;
        canvasEl.style.width = totalPx + 'px';
        canvasEl.style.height = totalPx + 'px';
        const ctx = canvasEl.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = level.grid[y][x];
                let color = '#0f0e17';
                if (cell === C.WALL)  color = '#2a2a4a';
                else if (cell === C.TRAP) color = '#5a2020';
                else if (cell === C.KEY)  color = '#5a5a20';
                else if (cell === C.COIN) color = '#3a3a1a';
                else if (cell === C.DOOR) color = '#3a1a3a';
                else if (cell === C.START) color = '#22c55e';
                else if (cell === C.EXIT)  color = '#e2b714';
                else if (cell === C.SPEED) color = '#5a4a10';
                else if (cell === C.FREEZE) color = '#1a3a5a';
                else if (cell === C.GHOST) color = '#3a1a5a';
                ctx.fillStyle = color;
                ctx.fillRect(x * px, y * px, px, px);
            }
        }
    }

    function renderLevels() {
        const container = document.getElementById('escape-levels-grid');
        if (!container) return;
        container.innerHTML = '';
        const levels = EscapeLevels.getAll();
        const lang = I18n.getLang();

        levels.forEach((level, index) => {
            const progress = Storage.getEscapeProgress(level.id);
            const unlocked = EscapeLevels.isUnlocked(level.id);

            const card = document.createElement('div');
            card.className = 'level-card escape-level-card';
            if (!unlocked) card.classList.add('locked');
            if (progress.completed) card.classList.add('completed');
            if (progress.stars === 3) card.classList.add('perfect');

            // Level number
            const num = document.createElement('div');
            num.className = 'level-number';
            if (unlocked) {
                num.textContent = index + 1;
            } else {
                num.innerHTML = '<span class="level-lock-icon">🔒</span>';
            }

            // Maze preview
            const preview = document.createElement('canvas');
            preview.className = 'maze-preview';
            if (unlocked) {
                drawMazePreview(preview, level);
            }

            // Difficulty indicator
            const diff = document.createElement('div');
            diff.className = 'escape-difficulty';
            if (unlocked) {
                const size = level.size;
                const chasers = level.chasers || 1;
                diff.textContent = `${size}×${size}`;
                if (chasers > 1) diff.textContent += ` 👹×${chasers}`;
            }

            // Stars
            const stars = document.createElement('div');
            stars.className = 'level-stars';
            if (progress.completed) {
                for (let i = 0; i < 3; i++) {
                    stars.textContent += i < progress.stars ? '⭐' : '☆';
                }
            }

            // Level name
            const name = document.createElement('div');
            name.className = 'escape-level-name';
            if (unlocked) {
                name.textContent = level.name[lang] || level.name.ru;
            }

            card.appendChild(num);
            card.appendChild(preview);
            card.appendChild(diff);
            card.appendChild(name);
            card.appendChild(stars);

            if (unlocked) {
                card.onclick = () => {
                    SFX.click();
                    App.showScreen('escape-game');
                    setTimeout(() => EscapeGame.start(level.id), 50);
                };
            }

            container.appendChild(card);
        });

        const starsEl = document.getElementById('escape-total-stars');
        if (starsEl) starsEl.textContent = Storage.getEscapeStars();
    }

    function refresh() {
        renderLevels();
    }

    return { init, refresh, drawMazePreview };
})();
