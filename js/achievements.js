/* ============================================
   Achievements — Unlockable badges & milestones
   ============================================ */

const Achievements = (() => {
    const DEFS = [
        // First steps
        { id: 'first_escape', icon: '🏃', name: { ru: 'Первый побег', en: 'First Escape' }, desc: { ru: 'Пройди первый уровень Побега', en: 'Complete first Escape level' } },
        { id: 'first_daily', icon: '📅', name: { ru: 'Ежедневник', en: 'Daily Player' }, desc: { ru: 'Пройди ежедневный вызов', en: 'Complete a daily challenge' } },
        { id: 'collector', icon: '🪙', name: { ru: 'Коллекционер', en: 'Collector' }, desc: { ru: 'Собери 50 монет суммарно', en: 'Collect 50 total coins' } },
        
        // Streaks
        { id: 'streak_3', icon: '🔥', name: { ru: 'Разогрев', en: 'Warming Up' }, desc: { ru: 'Серия 3 дня подряд', en: '3-day streak' } },
        { id: 'streak_7', icon: '💪', name: { ru: 'Неделька', en: 'Full Week' }, desc: { ru: 'Серия 7 дней подряд', en: '7-day streak' } },
        { id: 'streak_30', icon: '🏆', name: { ru: 'Месяц!', en: 'Monthly!' }, desc: { ru: 'Серия 30 дней подряд', en: '30-day streak' } },

        // XP milestones
        { id: 'xp_500', icon: '⭐', name: { ru: 'Новичок', en: 'Novice' }, desc: { ru: 'Набери 500 XP', en: 'Earn 500 XP' } },
        { id: 'xp_2500', icon: '🌟', name: { ru: 'Опытный', en: 'Experienced' }, desc: { ru: 'Набери 2500 XP', en: 'Earn 2500 XP' } },
        { id: 'xp_10000', icon: '💎', name: { ru: 'Мастер', en: 'Master' }, desc: { ru: 'Набери 10000 XP', en: 'Earn 10000 XP' } },

        // Perfection
        { id: 'perfect_3', icon: '✨', name: { ru: 'Перфекционист', en: 'Perfectionist' }, desc: { ru: 'Получи 3 звезды на 3 уровнях', en: 'Get 3 stars on 3 levels' } },
        { id: 'perfect_10', icon: '🎯', name: { ru: 'Снайпер', en: 'Sharpshooter' }, desc: { ru: 'Получи 3 звезды на 10 уровнях', en: 'Get 3 stars on 10 levels' } },

        // Skin & power-ups
        { id: 'skin_unlock', icon: '🎨', name: { ru: 'Модник', en: 'Fashionista' }, desc: { ru: 'Разблокируй 3 скина', en: 'Unlock 3 skins' } },
        { id: 'power_all', icon: '⚡', name: { ru: 'Электрик', en: 'Electrified' }, desc: { ru: 'Подбери все 3 типа бонусов', en: 'Pick up all 3 power-up types' } },

        // Speed
        { id: 'speed_demon', icon: '💨', name: { ru: 'Демон скорости', en: 'Speed Demon' }, desc: { ru: 'Пройди уровень менее чем за 15 шагов', en: 'Complete level in under 15 steps' } },
        
        // Completionist
        { id: 'escape_10', icon: '🗺️', name: { ru: 'Картограф', en: 'Cartographer' }, desc: { ru: 'Пройди 10 уровней Побега', en: 'Complete 10 Escape levels' } },
    ];

    function getUnlocked() {
        return Storage.get('achievements', []);
    }

    function isUnlocked(id) {
        return getUnlocked().includes(id);
    }

    function unlock(id) {
        if (isUnlocked(id)) return false;
        const list = getUnlocked();
        list.push(id);
        Storage.set('achievements', list);
        return true; // newly unlocked
    }

    // Show toast notification
    function showToast(achievementId) {
        const def = DEFS.find(d => d.id === achievementId);
        if (!def) return;

        const lang = I18n.getLang();
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <span class="achievement-toast-icon">${def.icon}</span>
            <div class="achievement-toast-text">
                <strong>${lang === 'en' ? '🏅 Achievement!' : '🏅 Достижение!'}</strong>
                <span>${def.name[lang] || def.name.ru}</span>
            </div>
        `;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);

        SFX.complete(1);
    }

    // Try to unlock and show toast if new
    function tryUnlock(id) {
        if (unlock(id)) {
            showToast(id);
            return true;
        }
        return false;
    }

    // Check all conditions based on current state
    function checkAll() {
        const xp = XPSystem.getXP();
        const streak = DailyChallenge.getStreak();
        const unlocked = CatSkins.getUnlockedSkins();
        const powerups = Storage.get('powerups_collected', { speed: false, freeze: false, ghost: false });

        // XP milestones
        if (xp >= 500) tryUnlock('xp_500');
        if (xp >= 2500) tryUnlock('xp_2500');
        if (xp >= 10000) tryUnlock('xp_10000');

        // Streaks
        if (streak.count >= 3) tryUnlock('streak_3');
        if (streak.count >= 7) tryUnlock('streak_7');
        if (streak.count >= 30) tryUnlock('streak_30');

        // Skins
        if (unlocked.length >= 3) tryUnlock('skin_unlock');

        // Power-ups
        if (powerups.speed && powerups.freeze && powerups.ghost) tryUnlock('power_all');

        // Count perfect levels (3 stars)
        let perfectCount = 0;
        let completedEscape = 0;
        let totalCoins = 0;
        // Check all escape progress
        for (let i = 1; i <= 20; i++) {
            const id = 'escape_' + String(i).padStart(2, '0');
            const prog = Storage.getEscapeProgress(id);
            if (prog.completed) {
                completedEscape++;
                totalCoins += prog.coins || 0;
                if (prog.stars >= 3) perfectCount++;
            }
        }
        // Also check daily
        const dailyKey = DailyChallenge.getTodayKey();
        const dailyProg = Storage.getEscapeProgress('daily_' + dailyKey);
        if (dailyProg.completed) {
            tryUnlock('first_daily');
            totalCoins += dailyProg.coins || 0;
        }

        if (completedEscape >= 1) tryUnlock('first_escape');
        if (completedEscape >= 10) tryUnlock('escape_10');
        if (totalCoins >= 50) tryUnlock('collector');
        if (perfectCount >= 3) tryUnlock('perfect_3');
        if (perfectCount >= 10) tryUnlock('perfect_10');
    }

    // Called from escape-game when a power-up is picked up
    function recordPowerup(type) {
        const collected = Storage.get('powerups_collected', { speed: false, freeze: false, ghost: false });
        collected[type] = true;
        Storage.set('powerups_collected', collected);
    }

    // Called on level complete with step count
    function checkSpeedDemon(steps) {
        if (steps <= 15) tryUnlock('speed_demon');
    }

    function getAllDefs() { return DEFS; }

    return { getUnlocked, isUnlocked, tryUnlock, checkAll, recordPowerup, checkSpeedDemon, getAllDefs, showToast };
})();
