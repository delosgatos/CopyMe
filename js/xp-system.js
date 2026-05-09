/* ============================================
   XP System — Player progression & levels
   ============================================ */

const XPSystem = (() => {
    const LEVELS = [
        { name: { ru: '🐱 Котёнок',    en: '🐱 Kitten' },      xp: 0 },
        { name: { ru: '🐈 Кот',        en: '🐈 Cat' },         xp: 200 },
        { name: { ru: '😺 Мурлыка',    en: '😺 Purrer' },      xp: 500 },
        { name: { ru: '🐯 Тигр',       en: '🐯 Tiger' },       xp: 1200 },
        { name: { ru: '🦁 Лев',        en: '🦁 Lion' },        xp: 2500 },
        { name: { ru: '🐉 Дракон',     en: '🐉 Dragon' },      xp: 5000 },
        { name: { ru: '👑 Легенда',    en: '👑 Legend' },       xp: 10000 },
    ];

    // XP rewards
    const REWARDS = {
        levelComplete: 100,
        star: 30,
        coin: 10,
        dailyComplete: 150,
        streakBonus: 50,  // per day of streak
        perfectRun: 80,   // 3 stars
    };

    function getXP() {
        return Storage.get('xp_total', 0);
    }

    function addXP(amount) {
        const current = getXP();
        const newXP = current + amount;
        Storage.set('xp_total', newXP);

        // Check for level up
        const oldLevel = getLevelForXP(current);
        const newLevel = getLevelForXP(newXP);
        
        return {
            xp: newXP,
            added: amount,
            leveledUp: newLevel.index > oldLevel.index,
            level: newLevel,
        };
    }

    function getLevelForXP(xp) {
        let idx = 0;
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xp) {
                idx = i;
                break;
            }
        }
        const current = LEVELS[idx];
        const next = LEVELS[idx + 1] || null;
        const progress = next
            ? (xp - current.xp) / (next.xp - current.xp)
            : 1;
        return {
            index: idx,
            name: current.name,
            xp: xp,
            xpForCurrent: current.xp,
            xpForNext: next ? next.xp : current.xp,
            progress: Math.min(1, progress),
            isMax: !next,
        };
    }

    function getCurrentLevel() {
        return getLevelForXP(getXP());
    }

    // Award XP for completing an escape/live/daily level
    function awardCompletion(stars, coinCount, isDaily, streakDays) {
        let total = REWARDS.levelComplete;
        total += stars * REWARDS.star;
        total += coinCount * REWARDS.coin;
        if (stars === 3) total += REWARDS.perfectRun;
        if (isDaily) {
            total += REWARDS.dailyComplete;
            total += Math.min(streakDays, 30) * REWARDS.streakBonus;
        }
        return addXP(total);
    }

    return { getXP, addXP, getCurrentLevel, awardCompletion, LEVELS, REWARDS };
})();
