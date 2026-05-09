/* ============================================
   Escape Levels — 12 handcrafted maze puzzles
   Increasing size + complexity, crossing required from L4+
   ============================================ */

const EscapeLevels = (() => {
    const C = {
        EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5,
        START: 8, EXIT: 9,
        SPEED: 10, FREEZE: 11, GHOST: 12,
        PORTAL_A: 13, PORTAL_B: 14, SLOW: 15,
        PORTAL_C: 16, PORTAL_D: 17,
    };

    const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, 
          O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT,
          SP = C.SPEED, FR = C.FREEZE, GH = C.GHOST,
          PA = C.PORTAL_A, PB = C.PORTAL_B, SL = C.SLOW,
          PC = C.PORTAL_C, PD = C.PORTAL_D;

    const levels = [
        // ═══════════════════════════════════════════
        // L1 (7×7) Tutorial — simple zigzag
        // ═══════════════════════════════════════════
        {
            id: 'escape_01',
            name: { ru: 'Первый побег', en: 'First Escape' },
            size: 7, timeLimit: 15000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,_,_,_],
                [W,W,W,W,W,_,W],
                [_,_,_,_,_,_,_],
                [_,W,W,W,W,W,W],
                [_,_,_,_,_,_,_],
                [W,W,W,W,W,_,W],
                [_,_,_,_,_,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L2 (7×7) Coins — branching paths
        // ═══════════════════════════════════════════
        {
            id: 'escape_02',
            name: { ru: 'Монетки', en: 'Coins' },
            size: 7, timeLimit: 14000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,_,O,_],
                [_,W,_,W,_,W,_],
                [_,W,_,_,_,W,_],
                [_,W,W,W,_,W,_],
                [_,_,_,_,_,_,_],
                [W,W,_,W,W,W,_],
                [O,_,_,_,_,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L3 (8×8) Fire — dodge the traps
        // ═══════════════════════════════════════════
        {
            id: 'escape_03',
            name: { ru: 'Осторожно, огонь!', en: 'Watch the Fire!' },
            size: 8, timeLimit: 15000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,_,_,_,_],
                [_,W,_,W,_,W,W,_],
                [_,W,_,_,_,T,_,_],
                [_,W,W,W,_,W,W,_],
                [_,_,_,T,_,_,_,_],
                [W,W,_,W,W,W,_,W],
                [_,_,_,_,_,_,_,_],
                [_,W,W,T,W,W,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L4 (9×9) CROSSING REQUIRED — Key in dead-end spur
        // Must go through corridor to key, backtrack (cross!) to door
        // ═══════════════════════════════════════════
        {
            id: 'escape_04',
            name: { ru: 'Петля', en: 'The Loop' },
            size: 9, timeLimit: 16000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,_,_,_,_,_],
                [W,W,_,W,_,W,W,W,_],
                [_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,_,W,_],
                [_,W,_,K,_,W,_,_,_],
                [_,W,_,W,W,W,W,W,_],
                [_,W,_,_,_,_,_,_,_],
                [_,W,W,W,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,D],
            ],
        },

        // ═══════════════════════════════════════════
        // L5 (9×9) Portals — teleport across the maze
        // ═══════════════════════════════════════════
        {
            id: 'escape_05',
            name: { ru: 'Телепорт', en: 'Teleport' },
            size: 9, timeLimit: 15000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,W,W,W,W,_],
                [_,W,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,_,W,_],
                [_,_,_,_,_,W,_,W,_],
                [W,W,W,W,_,W,PA,_,_],
                [_,_,_,_,_,W,W,W,W],
                [_,W,W,W,_,_,_,_,_],
                [_,_,PB,W,W,W,W,W,_],
                [W,W,_,_,_,_,_,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L6 (10×10) Crossing + Speed boost — tight corridors
        // ═══════════════════════════════════════════
        {
            id: 'escape_06',
            name: { ru: 'Запутанный путь', en: 'Tangled Path' },
            size: 10, timeLimit: 16000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,_,_,_,_,_,_],
                [W,W,_,W,_,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,_,W,_],
                [_,W,_,K,_,_,W,_,_,_],
                [_,W,_,W,W,_,W,W,W,_],
                [_,_,_,W,SP,_,_,_,W,_],
                [W,W,_,W,W,W,W,_,W,_],
                [_,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,_,_,D],
            ],
        },

        // ═══════════════════════════════════════════
        // L7 (11×11) TORNADO chaser + portal pair
        // Tornado ignores walls — real threat!
        // ═══════════════════════════════════════════
        {
            id: 'escape_07',
            name: { ru: 'Торнадо', en: 'Tornado' },
            size: 11, timeLimit: 18000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,W,_,_,_,_,_,_],
                [_,W,W,_,W,_,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,_,W,_],
                [W,W,W,W,W,W,W,W,_,W,_],
                [_,_,_,_,_,_,_,_,_,_,_],
                [_,W,W,W,_,W,W,W,W,W,W],
                [_,_,PA,W,_,_,_,_,_,_,_],
                [W,W,_,W,W,W,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,W,PB,_,_],
                [_,_,_,_,_,_,_,_,_,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L8 (11×11) Slow zones + crossing + 2 chasers
        // ═══════════════════════════════════════════
        {
            id: 'escape_08',
            name: { ru: 'Ледяной лабиринт', en: 'Ice Maze' },
            size: 11, timeLimit: 17000, runnerSpeed: 200,
            grid: [
                [S,_,_,W,_,_,_,_,W,_,_],
                [W,W,_,W,_,W,W,_,W,_,W],
                [_,_,_,_,_,SL,_,_,_,_,_],
                [_,W,W,W,W,W,W,W,W,_,W],
                [_,W,_,K,_,_,_,_,W,_,_],
                [_,W,_,W,W,W,W,_,W,W,_],
                [_,_,_,W,_,_,W,_,_,_,_],
                [W,W,_,W,_,W,W,W,_,W,W],
                [_,_,_,_,_,SL,_,_,_,_,_],
                [_,W,W,W,W,W,W,W,W,_,W],
                [_,_,_,_,_,_,SP,_,_,_,D],
            ],
        },

        // ═══════════════════════════════════════════
        // L9 (12×12) Dual portals — A↔B and C↔D
        // ═══════════════════════════════════════════
        {
            id: 'escape_09',
            name: { ru: 'Двойной портал', en: 'Dual Portal' },
            size: 12, timeLimit: 20000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,W,_,_,_,_,W,_,_],
                [_,W,W,_,W,_,W,W,_,W,_,W],
                [_,_,_,_,_,_,_,W,_,_,_,_],
                [W,W,W,W,W,W,_,W,W,W,W,_],
                [_,_,PA,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,W,W,_,_,_],
                [_,_,_,_,_,_,_,_,W,_,W,W],
                [W,W,W,W,W,W,W,_,W,_,PC,_],
                [_,_,_,PB,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,PD,_,_,_],
                [W,W,W,W,W,W,W,W,_,W,W,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L10 (13×13) Complex crossing + tornado + key
        // ═══════════════════════════════════════════
        {
            id: 'escape_10',
            name: { ru: 'Хаос', en: 'Chaos' },
            size: 13, timeLimit: 22000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,W,_,_,_,_,W,_,_,_],
                [_,W,W,_,W,_,W,W,_,W,_,W,_],
                [_,_,_,_,_,_,_,W,_,_,_,W,_],
                [W,W,W,W,_,W,_,W,W,W,_,W,_],
                [_,_,_,_,_,W,_,_,_,_,_,_,_],
                [_,W,W,W,W,W,W,W,W,W,W,W,_],
                [_,_,_,PA,_,_,K,_,_,PB,_,_,_],
                [_,W,W,W,W,W,W,W,W,W,W,W,_],
                [_,_,_,_,_,W,_,_,_,_,_,_,_],
                [W,W,W,_,W,W,_,W,W,W,W,_,W],
                [_,_,_,_,_,_,_,W,_,_,_,_,_],
                [_,W,W,W,W,W,_,W,_,W,W,W,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,D],
            ],
        },

        // ═══════════════════════════════════════════
        // L11 (14×14) Multi-portal + crossing + traps
        // ═══════════════════════════════════════════
        {
            id: 'escape_11',
            name: { ru: 'Лабиринт Минотавра', en: 'Minotaur Maze' },
            size: 14, timeLimit: 24000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,W,_,_,_,_,_,W,_,_,_],
                [_,W,W,_,W,_,W,W,W,_,W,_,W,_],
                [_,_,_,_,_,_,_,_,W,_,_,_,W,_],
                [W,W,W,W,W,W,W,_,W,W,W,_,W,_],
                [_,_,_,PA,_,_,_,_,_,_,W,_,_,_],
                [_,W,W,W,W,W,_,W,W,_,W,W,W,W],
                [_,_,_,_,_,T,_,_,W,_,_,_,_,_],
                [W,W,W,W,_,W,W,_,W,W,W,W,W,_],
                [_,_,_,_,_,_,W,_,_,_,_,_,W,_],
                [_,W,W,W,W,_,W,W,W,W,W,_,_,_],
                [_,_,_,PB,W,_,_,_,T,_,W,_,W,W],
                [W,W,_,W,W,W,W,W,W,_,W,_,_,_],
                [_,_,_,_,_,_,_,_,_,_,W,W,W,_],
                [_,W,W,W,W,W,W,W,W,_,_,_,_,E],
            ],
        },

        // ═══════════════════════════════════════════
        // L12 (15×15) The Ultimate — everything combined
        // ═══════════════════════════════════════════
        {
            id: 'escape_12',
            name: { ru: 'Финальное испытание', en: 'The Final Test' },
            size: 15, timeLimit: 25000, runnerSpeed: 200,
            grid: [
                [S,_,_,_,W,_,_,_,_,_,W,_,_,_,_],
                [_,W,W,_,W,_,W,W,W,_,W,_,W,W,_],
                [_,_,_,_,_,_,_,_,W,_,_,_,_,W,_],
                [W,W,W,W,W,W,_,W,W,W,W,W,_,W,_],
                [_,_,_,_,_,_,_,_,_,_,PA,W,_,_,_],
                [_,W,W,W,W,W,W,W,W,_,W,W,W,W,_],
                [_,_,_,_,SL,_,_,_,W,_,_,_,_,_,_],
                [W,W,W,_,W,W,W,_,W,W,W,W,W,W,W],
                [_,_,_,_,_,K,W,_,_,_,_,_,_,_,_],
                [_,W,W,W,_,W,W,W,W,W,W,W,W,_,W],
                [_,_,_,W,_,_,_,_,_,_,_,_,W,_,_],
                [W,W,_,W,W,W,W,W,_,W,W,_,W,W,_],
                [_,_,_,_,_,_,PB,_,_,_,W,_,_,_,_],
                [_,W,W,W,W,W,W,W,W,_,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,_,_,_,_,SP,_,D],
            ],
        },
    ];

    function getAll()       { return levels; }
    function getById(id)    { return levels.find(l => l.id === id); }
    function getCount()     { return levels.length; }
    function getByIndex(i)  { return levels[i] || null; }
    function getNext(id) {
        const idx = levels.findIndex(l => l.id === id);
        return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;
    }

    function isUnlocked(id) {
        const idx = levels.findIndex(l => l.id === id);
        if (idx === 0) return true;
        const prev = levels[idx - 1];
        return prev ? Storage.getEscapeProgress(prev.id).completed : true;
    }

    return { C, getAll, getById, getCount, getByIndex, getNext, isUnlocked };
})();
