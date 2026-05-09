/* ============================================
   LiveLevelSelect — Level grid for Выживание
   ============================================ */

const LiveLevelSelect = (() => {
    function init() {
        renderLevels();
    }

    function renderLevels() {
        const container = document.getElementById('live-levels-grid');
        if (!container) return;
        container.innerHTML = '';
        const levels = LiveLevels.getAll();
        const lang = I18n.getLang();

        levels.forEach((level, index) => {
            const progress = Storage.getEscapeProgress(level.id);
            const unlocked = LiveLevels.isUnlocked(level.id);

            const card = document.createElement('div');
            card.className = 'level-card escape-level-card';
            if (!unlocked) card.classList.add('locked');
            if (progress.completed) card.classList.add('completed');
            if (progress.stars === 3) card.classList.add('perfect');

            const num = document.createElement('div');
            num.className = 'level-number';
            if (unlocked) {
                num.textContent = index + 1;
            } else {
                num.innerHTML = '<span class="level-lock-icon">🔒</span>';
            }

            // Maze preview — reuse from EscapeLevelSelect
            const preview = document.createElement('canvas');
            preview.className = 'maze-preview';
            if (unlocked && typeof EscapeLevelSelect !== 'undefined') {
                EscapeLevelSelect.drawMazePreview(preview, level);
            }

            const diff = document.createElement('div');
            diff.className = 'escape-difficulty';
            if (unlocked) {
                const size = level.size;
                const chasers = level.chasers || 1;
                diff.textContent = `${size}×${size}`;
                if (chasers > 1) diff.textContent += ` 👹×${chasers}`;
            }

            const stars = document.createElement('div');
            stars.className = 'level-stars';
            if (progress.completed) {
                for (let i = 0; i < 3; i++) {
                    stars.textContent += i < progress.stars ? '⭐' : '☆';
                }
            }

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
                    setTimeout(() => EscapeGame.start(level.id, 'live'), 50);
                };
            }

            container.appendChild(card);
        });

        const starsEl = document.getElementById('live-total-stars');
        if (starsEl) starsEl.textContent = Storage.getEscapeStars();
    }

    function refresh() {
        renderLevels();
    }

    return { init, refresh };
})();
