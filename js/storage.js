/* ============================================
   Storage — localStorage wrapper
   ============================================ */

const Storage = (() => {
    const PREFIX = 'copyme_';

    function get(key, defaultVal = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (raw === null) return defaultVal;
            return JSON.parse(raw);
        } catch {
            return defaultVal;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage write error:', e);
        }
    }

    function remove(key) {
        localStorage.removeItem(PREFIX + key);
    }

    // Level progress: { stars: 0-3, completed: bool, bestTime: ms }
    function getLevelProgress(levelId) {
        return get('level_' + levelId, { stars: 0, completed: false, bestTime: null });
    }

    function setLevelProgress(levelId, data) {
        const existing = getLevelProgress(levelId);
        const merged = {
            stars: Math.max(existing.stars, data.stars || 0),
            completed: existing.completed || data.completed || false,
            bestTime: data.bestTime
                ? (existing.bestTime ? Math.min(existing.bestTime, data.bestTime) : data.bestTime)
                : existing.bestTime
        };
        set('level_' + levelId, merged);
    }

    function getTotalStars() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX + 'level_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    total += (data.stars || 0);
                } catch {}
            }
        }
        return total;
    }

    function getCompletedCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX + 'level_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.completed) count++;
                } catch {}
            }
        }
        return count;
    }

    // === Escape progress ===
    function getEscapeProgress(levelId) {
        return get('escape_' + levelId, { stars: 0, completed: false, coins: 0 });
    }

    function setEscapeProgress(levelId, data) {
        const existing = getEscapeProgress(levelId);
        const merged = {
            stars: Math.max(existing.stars, data.stars || 0),
            completed: existing.completed || data.completed || false,
            coins: Math.max(existing.coins || 0, data.coins || 0),
        };
        set('escape_' + levelId, merged);
    }

    function getEscapeStars() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX + 'escape_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    total += (data.stars || 0);
                } catch {}
            }
        }
        return total;
    }

    function getEscapeCompletedCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PREFIX + 'escape_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.completed) count++;
                } catch {}
            }
        }
        return count;
    }

    return {
        get, set, remove,
        getLevelProgress, setLevelProgress, getTotalStars, getCompletedCount,
        getEscapeProgress, setEscapeProgress, getEscapeStars, getEscapeCompletedCount,
    };
})();
