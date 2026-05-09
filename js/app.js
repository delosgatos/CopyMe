/* ============================================
   App — Main application controller
   Supports multiple game types: Draw, Escape
   ============================================ */

const App = (() => {
    let currentScreen = 'splash';
    let currentGameType = 'draw'; // 'draw' | 'escape'

    function init() {
        // Initialize subsystems
        SFX.init();
        I18n.init();

        // Render splash demo
        renderSplashDemo();

        // === Game Type selector ===
        document.getElementById('btn-type-draw').onclick = () => {
            SFX.click();
            currentGameType = 'draw';
            showScreen('levels');
            LevelSelect.init();
        };

        document.getElementById('btn-type-escape').onclick = () => {
            SFX.click();
            showScreen('escape-levels');
            EscapeLevelSelect.init();
        };

        document.getElementById('btn-type-live').onclick = () => {
            SFX.click();
            showScreen('live-levels');
            LiveLevelSelect.init();
        };

        // Endless mode
        const btnEndless = document.getElementById('btn-type-endless');
        if (btnEndless) {
            // Show high score
            const hs = EndlessMode.getHighScore();
            const hsEl = document.getElementById('endless-highscore');
            if (hsEl) hsEl.textContent = '🏆 ' + hs;

            btnEndless.onclick = () => {
                SFX.click();
                EndlessMode.reset();
                const wave1 = EndlessMode.generateWave(1);
                showScreen('escape-game');
                setTimeout(() => EscapeGame.start(wave1.id, 'endless', wave1), 50);
            };
        }

        // === Draw mode navigation ===
        document.getElementById('btn-back-home').onclick = () => {
            SFX.click();
            showScreen('splash');
        };

        document.getElementById('btn-back-levels').onclick = () => {
            SFX.click();
            Modes.stopTimer();
            Modes.cancelMemory();
            showScreen('levels');
            LevelSelect.refresh();
        };

        // === Escape mode navigation ===
        document.getElementById('btn-back-home-escape').onclick = () => {
            SFX.click();
            showScreen('splash');
        };

        document.getElementById('btn-back-escape-levels').onclick = () => {
            SFX.click();
            EscapeGame.stop();
            const mode = EscapeGame.getMode();
            if (mode === 'endless' || mode === 'daily') {
                showScreen('splash');
            } else if (mode === 'live') {
                showScreen('live-levels');
                LiveLevelSelect.refresh();
            } else {
                showScreen('escape-levels');
                EscapeLevelSelect.refresh();
            }
        };

        document.getElementById('btn-back-live-home').onclick = () => {
            SFX.click();
            showScreen('splash');
        };

        // === Escape game buttons ===
        document.getElementById('escape-btn-start').onclick = () => {
            SFX.click();
            EscapeGame.startRun();
        };

        document.getElementById('escape-btn-undo').onclick = () => {
            EscapeGame.undoLastCell();
        };

        document.getElementById('escape-btn-clear').onclick = () => {
            SFX.click();
            EscapeGame.clearPath();
        };

        // === Language switcher ===
        document.querySelectorAll('.btn-lang[data-lang]').forEach(btn => {
            btn.onclick = () => {
                const lang = btn.dataset.lang;
                I18n.setLang(lang);
                document.querySelectorAll('.btn-lang').forEach(b => {
                    b.classList.toggle('active', b.dataset.lang === lang);
                });
                SFX.click();
                if (currentScreen === 'levels') {
                    LevelSelect.refresh();
                }
                if (currentScreen === 'escape-levels') {
                    EscapeLevelSelect.refresh();
                }
            };
        });

        // Set initial lang buttons
        const lang = I18n.getLang();
        document.querySelectorAll('.btn-lang[data-lang]').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === lang);
        });

        // === Music Toggle ===
        const btnMusicToggle = document.getElementById('btn-toggle-music');
        const btnMusicInGame = document.getElementById('btn-music-ingame');
        if (btnMusicToggle) {
            btnMusicToggle.textContent = SFX.isMusicPlaying() ? '🎵' : '🔇';
            btnMusicToggle.onclick = () => {
                const isPlaying = SFX.toggleMusic();
                btnMusicToggle.textContent = isPlaying ? '🎵' : '🔇';
                if (btnMusicInGame) btnMusicInGame.textContent = isPlaying ? '🎵' : '🔇';
            };
        }
        if (btnMusicInGame) {
            btnMusicInGame.textContent = SFX.isMusicPlaying() ? '🎵' : '🔇';
            btnMusicInGame.onclick = () => {
                const isPlaying = SFX.toggleMusic();
                btnMusicInGame.textContent = isPlaying ? '🎵' : '🔇';
                if (btnMusicToggle) btnMusicToggle.textContent = isPlaying ? '🎵' : '🔇';
            };
        }

        // === Daily Challenge ===
        initDailyChallenge();

        // === XP Bar ===
        updateXPBar();

        // === Achievements ===
        initAchievements();

        // === Stats ===
        initStats();

        console.log('🎨 CopyMe initialized!');
    }

    function initStats() {
        const btn = document.getElementById('btn-stats');
        const modal = document.getElementById('modal-stats');
        const closeBtn = document.getElementById('btn-close-stats');

        if (btn) {
            btn.onclick = () => {
                SFX.click();
                renderStats();
                modal.classList.add('active');
            };
        }
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    }

    function renderStats() {
        const container = document.getElementById('stats-content');
        if (!container) return;
        const lang = I18n.getLang();
        const lvl = XPSystem.getCurrentLevel();
        const skin = CatSkins.getActiveSkin();

        const wins = Storage.get('stat_wins', 0) || 0;
        const losses = Storage.get('stat_losses', 0) || 0;
        const games = Storage.get('stat_games', 0) || 0;
        const winrate = games > 0 ? Math.round((wins / games) * 100) : 0;
        const streak = DailyChallenge.getStreak();
        const endlessHS = EndlessMode.getHighScore();
        const achievements = Achievements.getUnlocked();
        const totalAch = Achievements.getAllDefs().length;
        const skinCount = CatSkins.getUnlockedSkins().length;
        const totalSkins = CatSkins.getAllSkins().length;
        const escapeStars = Storage.getEscapeStars();

        container.innerHTML = `
            <div class="stats-section">
                <div class="stats-profile-header">
                    <div class="stats-avatar" style="background: ${skin.body}20; border-color: ${skin.body};">
                        ${skin.id === 'legend' ? '👑' : '🐱'}
                    </div>
                    <div class="stats-player-info">
                        <span class="stats-player-name">${lvl.name[lang] || lvl.name.ru}</span>
                        <span class="stats-player-rank">${lvl.xp} XP</span>
                    </div>
                </div>
            </div>

            <div class="stats-section">
                <div class="stats-section-title">${lang === 'en' ? 'Overview' : 'Обзор'}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${games}</span>
                        <span class="stat-label">${lang === 'en' ? 'Games' : 'Игр'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${wins}</span>
                        <span class="stat-label">${lang === 'en' ? 'Wins' : 'Побед'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${winrate}%</span>
                        <span class="stat-label">${lang === 'en' ? 'Win Rate' : 'Винрейт'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">⭐ ${escapeStars}</span>
                        <span class="stat-label">${lang === 'en' ? 'Stars' : 'Звёзд'}</span>
                    </div>
                </div>
                <div class="stats-winrate-bar">
                    <div class="stats-winrate-fill" style="width: ${winrate}%"></div>
                </div>
            </div>

            <div class="stats-section">
                <div class="stats-section-title">${lang === 'en' ? 'Records' : 'Рекорды'}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">♾️ ${endlessHS}</span>
                        <span class="stat-label">${lang === 'en' ? 'Best Wave' : 'Лучшая волна'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">🔥 ${streak.count}</span>
                        <span class="stat-label">${lang === 'en' ? 'Streak' : 'Серия'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">🏅 ${achievements.length}/${totalAch}</span>
                        <span class="stat-label">${lang === 'en' ? 'Badges' : 'Бейджи'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">🎨 ${skinCount}/${totalSkins}</span>
                        <span class="stat-label">${lang === 'en' ? 'Skins' : 'Скины'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function initAchievements() {
        const btn = document.getElementById('btn-achievements');
        const modal = document.getElementById('modal-achievements');
        const closeBtn = document.getElementById('btn-close-achievements');

        if (btn) {
            btn.onclick = () => {
                SFX.click();
                Achievements.checkAll(); // refresh
                renderAchievementsGrid();
                modal.classList.add('active');
            };
        }
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('active');
        }
    }

    function renderAchievementsGrid() {
        const grid = document.getElementById('achievements-grid');
        const counter = document.getElementById('achievement-counter');
        if (!grid) return;

        const defs = Achievements.getAllDefs();
        const unlocked = Achievements.getUnlocked();
        const lang = I18n.getLang();

        if (counter) {
            counter.textContent = `${unlocked.length} / ${defs.length}`;
        }

        grid.innerHTML = '';
        defs.forEach(def => {
            const badge = document.createElement('div');
            const isUnlocked = unlocked.includes(def.id);
            badge.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
            badge.innerHTML = `
                <span class="achievement-badge-icon">${isUnlocked ? def.icon : '🔒'}</span>
                <span class="achievement-badge-name">${def.name[lang] || def.name.ru}</span>
                <span class="achievement-badge-desc">${def.desc[lang] || def.desc.ru}</span>
            `;
            grid.appendChild(badge);
        });
    }

    function updateXPBar() {
        const lvl = XPSystem.getCurrentLevel();
        const lang = I18n.getLang();
        const nameEl = document.getElementById('xp-level-name');
        const fillEl = document.getElementById('xp-bar-fill');
        const labelEl = document.getElementById('xp-bar-label');

        if (nameEl) nameEl.textContent = lvl.name[lang] || lvl.name.ru;
        if (fillEl) fillEl.style.width = (lvl.progress * 100).toFixed(1) + '%';
        if (labelEl) {
            if (lvl.isMax) {
                labelEl.textContent = `${lvl.xp} XP — MAX!`;
            } else {
                labelEl.textContent = `${lvl.xp} / ${lvl.xpForNext} XP`;
            }
        }
        renderSkinSelector();
    }

    function renderSkinSelector() {
        const container = document.getElementById('skin-selector');
        if (!container) return;
        container.innerHTML = '';

        const allSkins = CatSkins.getAllSkins();
        const unlocked = CatSkins.getUnlockedSkins();
        const active = CatSkins.getActiveSkin();
        const lang = I18n.getLang();

        allSkins.forEach(skin => {
            const dot = document.createElement('div');
            dot.className = 'skin-dot';
            dot.style.background = skin.body;
            dot.title = skin.name[lang] || skin.name.ru;

            const isUnlocked = unlocked.find(s => s.id === skin.id);
            if (!isUnlocked) {
                dot.classList.add('locked');
            } else {
                if (skin.id === active.id) dot.classList.add('active');
                dot.onclick = () => {
                    SFX.click();
                    CatSkins.setActiveSkin(skin.id);
                    renderSkinSelector();
                };
            }

            container.appendChild(dot);
        });
    }

    function initDailyChallenge() {
        const card = document.getElementById('daily-challenge-card');
        if (!card) return;

        function updateDailyUI() {
            const lang = I18n.getLang();
            const titleEl = document.getElementById('daily-title');
            const timerEl = document.getElementById('daily-timer');
            const streakEl = document.getElementById('daily-streak');
            const statusEl = document.getElementById('daily-status');

            const completed = DailyChallenge.isCompletedToday();
            const streak = DailyChallenge.getStreak();
            const time = DailyChallenge.getTimeUntilNext();

            if (titleEl) titleEl.textContent = lang === 'en' ? 'Daily Challenge' : 'Ежедневный вызов';
            if (timerEl) {
                if (completed) {
                    timerEl.textContent = lang === 'en'
                        ? `Next in ${time.hours}h ${time.mins}m`
                        : `Новый через ${time.hours}ч ${time.mins}м`;
                } else {
                    timerEl.textContent = lang === 'en' ? 'Not completed yet!' : 'Ещё не пройден!';
                }
            }
            if (streakEl) streakEl.textContent = `🔥 ${streak.count}`;
            if (statusEl) statusEl.textContent = completed ? '✅' : '▶';
            card.classList.toggle('completed', completed);
        }

        updateDailyUI();
        // Refresh timer every minute
        setInterval(updateDailyUI, 60000);

        card.onclick = () => {
            SFX.click();
            showScreen('escape-game');
            const dailyLevel = DailyChallenge.generateToday();
            setTimeout(() => EscapeGame.start(dailyLevel.id, 'daily', dailyLevel), 50);
        };
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
        // Refresh XP bar when returning to splash
        if (screenId === 'splash') {
            updateXPBar();
            Achievements.checkAll();
            // Update endless high score display
            const hsEl = document.getElementById('endless-highscore');
            if (hsEl) hsEl.textContent = '🏆 ' + EndlessMode.getHighScore();
        }
    }

    function renderSplashDemo() {
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
        animateSplashDemo(canvas, demoGrid, demoPalette, cellSize, size);
    }

    function animateSplashDemo(canvas, grid, palette, cellSize, size) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cells = [];
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                cells.push({ x, y, color: palette[grid[y][x]] });
            }
        }
        for (let i = cells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cells[i], cells[j]] = [cells[j], cells[i]];
        }

        let idx = 0;
        function drawNext() {
            if (idx >= cells.length) {
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

    // --- Floating pixel particles on splash screen ---
    function initSplashParticles() {
        const canvas = document.getElementById('splash-particles');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const colors = ['#e2b714', '#f39c12', '#e74c3c', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        let particles = [];
        let animId = null;

        function resize() {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        for (let i = 0; i < 35; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 2 + Math.random() * 4,
                speedY: -0.2 - Math.random() * 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 0.1 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const time = Date.now() / 1000;

            for (const p of particles) {
                p.y += p.speedY;
                p.x += Math.sin(time + p.phase) * 0.3 + p.speedX;

                // Wrap around
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;

                const flicker = 0.7 + 0.3 * Math.sin(time * 2 + p.phase);
                ctx.globalAlpha = p.alpha * flicker;
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
            }

            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(draw);
        }
        draw();
    }
    // Start particles
    initSplashParticles();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { showScreen, init };
})();
