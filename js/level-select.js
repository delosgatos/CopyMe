/* ============================================
   LevelSelect — Level selection + Mode picker
   ============================================ */

const LevelSelect = (() => {
    let currentPack = 'animals';

    function init() {
        renderPackTabs();
        renderLevels();
    }

    function renderPackTabs() {
        const container = document.getElementById('pack-tabs');
        container.innerHTML = '';
        const packs = Levels.getPacks();
        const lang = I18n.getLang();

        packs.forEach(pack => {
            const btn = document.createElement('button');
            btn.className = 'pack-tab' + (pack.id === currentPack ? ' active' : '');
            btn.textContent = pack.icon + ' ' + (pack.name[lang] || pack.name.ru);
            btn.onclick = () => {
                currentPack = pack.id;
                renderPackTabs();
                renderLevels();
                SFX.click();
            };
            container.appendChild(btn);
        });
    }

    function renderLevels() {
        const container = document.getElementById('levels-grid');
        container.innerHTML = '';
        const levels = Levels.getByPack(currentPack);
        const palette = Levels.getPalette(currentPack);

        levels.forEach((level, index) => {
            const progress = Storage.getLevelProgress(level.id);
            const unlocked = Levels.isUnlocked(level.id);

            const card = document.createElement('div');
            card.className = 'level-card';
            if (!unlocked) card.classList.add('locked');
            if (progress.completed) card.classList.add('completed');
            if (progress.stars === 3) card.classList.add('perfect');

            // Preview canvas
            const previewCanvas = document.createElement('canvas');
            previewCanvas.className = 'level-preview';
            if (unlocked || progress.completed) {
                CanvasRenderer.renderPreview(previewCanvas, level.grid, palette, 72);
            }

            // Level number
            const num = document.createElement('div');
            num.className = 'level-number';
            if (unlocked) {
                num.textContent = index + 1;
            } else {
                num.innerHTML = '<span class="level-lock-icon">🔒</span>';
            }

            // Stars
            const stars = document.createElement('div');
            stars.className = 'level-stars';
            if (progress.completed) {
                for (let i = 0; i < 3; i++) {
                    stars.textContent += i < progress.stars ? '⭐' : '☆';
                }
            }

            card.appendChild(previewCanvas);
            card.appendChild(num);
            card.appendChild(stars);

            if (unlocked) {
                card.onclick = () => {
                    SFX.click();
                    showModeSelector(level);
                };
            }

            container.appendChild(card);
        });

        document.getElementById('total-stars').textContent = Storage.getTotalStars();
    }

    // --- Mode selector modal ---
    function showModeSelector(level) {
        const modal = document.getElementById('modal-mode');
        const grid = document.getElementById('mode-selector-grid');
        const title = document.getElementById('mode-selector-title');
        const lang = I18n.getLang();

        title.textContent = level.name[lang] || level.name.ru;

        grid.innerHTML = '';
        const allModes = Modes.getAll();

        Object.values(allModes).forEach(mode => {
            const unlocked = Modes.isUnlocked(mode.id);
            const btn = document.createElement('button');
            btn.className = 'mode-card' + (unlocked ? '' : ' locked');

            const icon = document.createElement('div');
            icon.className = 'mode-icon';
            icon.textContent = mode.icon;

            const name = document.createElement('div');
            name.className = 'mode-name';
            name.textContent = mode.name[lang] || mode.name.ru;

            const desc = document.createElement('div');
            desc.className = 'mode-desc';

            if (unlocked) {
                desc.textContent = mode.desc[lang] || mode.desc.ru;
            } else {
                const needed = mode.unlockLevel;
                const completed = Storage.getCompletedCount();
                desc.textContent = lang === 'en'
                    ? `Complete ${needed - completed} more levels`
                    : `Ещё ${needed - completed} уровней`;
                const lock = document.createElement('div');
                lock.className = 'mode-lock';
                lock.textContent = '🔒';
                btn.appendChild(lock);
            }

            const info = document.createElement('div');
            info.className = 'mode-info';
            info.appendChild(name);
            info.appendChild(desc);

            btn.appendChild(icon);
            btn.appendChild(info);

            if (unlocked) {
                btn.onclick = () => {
                    modal.classList.remove('active');
                    SFX.click();
                    Modes.setCurrent(mode.id);
                    App.showScreen('game');
                    setTimeout(() => Game.start(level.id, mode.id), 50);
                };
            }

            grid.appendChild(btn);
        });

        modal.classList.add('active');

        // Close on backdrop click
        document.getElementById('mode-close').onclick = () => {
            modal.classList.remove('active');
            SFX.click();
        };
    }

    function refresh() {
        renderPackTabs();
        renderLevels();
    }

    return { init, refresh };
})();
