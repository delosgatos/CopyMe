/* ============================================
   Escape Levels — Maze data for Побег mode
   Cell values:
     0 = empty (passable)
     1 = wall
     2 = trap (fire)
     3 = key
     4 = coin
     5 = door (locked, needs key)
     S = start (encoded as 8)
     E = exit  (encoded as 9)
    10 = speed power-up
    11 = freeze power-up
    12 = ghost power-up
   ============================================ */

const EscapeLevels = (() => {
    // Cell type constants
    const C = {
        EMPTY: 0,
        WALL:  1,
        TRAP:  2,
        KEY:   3,
        COIN:  4,
        DOOR:  5,   // locked door (needs key)
        START: 8,
        EXIT:  9,
        SPEED: 10,
        FREEZE: 11,
        GHOST: 12,
    };

    const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, 
          O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT,
          SP = C.SPEED, FR = C.FREEZE, GH = C.GHOST;

    const levels = [
        // === Level 1: Tutorial — simple zigzag, no traps ===
        {
            id: 'escape_01',
            name: { ru: 'Первый побег', en: 'First Escape' },
            size: 7,
            chaserDelay: 4000,
            chaserSpeed: 500,
            runnerSpeed: 250,
            chasers: 1,
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
        // === Level 2: First coins — slight branching ===
        {
            id: 'escape_02',
            name: { ru: 'Монетки', en: 'Coins' },
            size: 7,
            chaserDelay: 3500,
            chaserSpeed: 450,
            runnerSpeed: 240,
            chasers: 1,
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
        // === Level 3: First traps ===
        {
            id: 'escape_03',
            name: { ru: 'Осторожно, огонь!', en: 'Watch the Fire!' },
            size: 8,
            chaserDelay: 3000,
            chaserSpeed: 400,
            runnerSpeed: 240,
            chasers: 1,
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
        // === Level 4: Multiple paths with coins and traps ===
        {
            id: 'escape_04',
            name: { ru: 'Развилка', en: 'Crossroads' },
            size: 8,
            chaserDelay: 2800,
            chaserSpeed: 380,
            runnerSpeed: 230,
            chasers: 1,
            grid: [
                [S,_,_,_,W,_,O,_],
                [_,W,W,_,W,_,W,_],
                [_,_,_,_,_,_,W,_],
                [W,W,_,W,W,_,_,_],
                [_,_,_,_,W,W,W,_],
                [_,W,W,_,_,_,T,_],
                [_,_,W,_,W,_,W,_],
                [O,_,_,_,W,_,_,E],
            ],
        },
        // === Level 5: Key + Door ===
        {
            id: 'escape_05',
            name: { ru: 'Найди ключ!', en: 'Find the Key!' },
            size: 8,
            chaserDelay: 2500,
            chaserSpeed: 360,
            runnerSpeed: 220,
            chasers: 1,
            grid: [
                [S,_,_,W,_,_,_,_],
                [_,W,_,W,_,W,_,K],
                [_,W,_,_,_,W,_,_],
                [_,_,_,W,_,W,W,_],
                [W,W,_,W,_,_,_,_],
                [_,_,_,_,_,W,W,W],
                [_,W,W,W,_,_,_,_],
                [_,_,_,_,_,W,W,D],
            ],
        },
        // === Level 6: Bigger maze — 10x10 ===
        {
            id: 'escape_06',
            name: { ru: 'Большой лабиринт', en: 'Big Maze' },
            size: 10,
            chaserDelay: 2500,
            chaserSpeed: 350,
            runnerSpeed: 220,
            chasers: 1,
            grid: [
                [S,_,_,W,_,_,O,_,_,_],
                [_,W,_,W,_,W,W,_,W,_],
                [_,W,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,_,W,W,_],
                [_,_,_,_,_,_,_,_,_,_],
                [W,W,W,_,W,W,W,W,_,W],
                [_,_,_,_,W,_,_,_,_,_],
                [_,W,W,_,W,_,W,W,W,_],
                [_,_,W,_,_,_,_,_,_,_],
                [W,_,W,W,W,_,W,W,_,E],
            ],
        },
        // === Level 7: Double chase with power-ups ===
        {
            id: 'escape_07',
            name: { ru: 'Двойная погоня', en: 'Double Chase' },
            size: 10,
            chaserDelay: 2200,
            chaserSpeed: 330,
            runnerSpeed: 210,
            chasers: 2,
            grid: [
                [S,_,_,W,_,_,_,_,W,_],
                [_,W,_,_,_,W,W,_,W,_],
                [_,W,W,W,_,W,_,_,_,_],
                [_,_,_,W,_,_,_,W,W,_],
                [W,W,_,_,_,W,_,SP,_,_],
                [_,_,_,W,_,W,W,W,_,W],
                [_,W,_,W,_,_,_,_,_,_],
                [_,W,_,_,_,W,W,_,W,_],
                [_,_,_,W,_,_,W,_,W,_],
                [W,_,W,W,FR,_,_,_,_,E],
            ],
        },
        // === Level 8: Treasure + Door (10x10) ===
        {
            id: 'escape_08',
            name: { ru: 'Сокровища', en: 'Treasures' },
            size: 10,
            chaserDelay: 2000,
            chaserSpeed: 320,
            runnerSpeed: 200,
            chasers: 2,
            grid: [
                [S,_,_,W,_,_,O,_,_,_],
                [_,W,_,W,_,W,W,_,W,K],
                [_,W,_,_,_,_,_,_,_,_],
                [_,W,W,W,W,_,W,W,W,_],
                [_,_,O,_,_,_,W,_,_,_],
                [W,W,W,_,W,_,_,_,W,_],
                [O,_,_,_,W,_,W,_,W,_],
                [W,_,W,_,_,_,W,_,_,_],
                [_,_,W,W,W,_,W,W,W,_],
                [_,_,_,_,_,_,_,O,_,D],
            ],
        },
        // === Level 9: Fire gauntlet ===
        {
            id: 'escape_09',
            name: { ru: 'Огненный забег', en: 'Fire Gauntlet' },
            size: 10,
            chaserDelay: 1800,
            chaserSpeed: 300,
            runnerSpeed: 200,
            chasers: 2,
            grid: [
                [S,_,_,_,W,_,_,_,_,_],
                [W,_,W,_,W,_,W,T,W,_],
                [_,_,W,_,_,_,_,_,W,_],
                [_,W,W,W,_,W,W,_,_,_],
                [_,_,T,_,_,_,W,_,W,_],
                [W,_,W,W,W,_,_,_,W,_],
                [_,_,_,_,W,_,W,_,_,_],
                [_,W,W,_,T,_,W,W,W,_],
                [_,_,W,_,W,_,_,_,_,_],
                [W,_,_,_,W,_,W,W,_,E],
            ],
        },
        // === Level 10: The Final Maze ===
        {
            id: 'escape_10',
            name: { ru: 'Финальный лабиринт', en: 'The Final Maze' },
            size: 12,
            chaserDelay: 1500,
            chaserSpeed: 280,
            runnerSpeed: 190,
            chasers: 2,
            grid: [
                [S,_,_,W,_,_,_,_,W,_,_,_],
                [_,W,_,W,_,W,W,_,W,_,W,_],
                [_,W,_,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,_,W,W,_,_,_],
                [_,_,_,_,_,_,_,_,W,_,W,W],
                [W,W,W,_,W,W,W,_,_,_,_,_],
                [_,_,_,_,W,_,_,_,W,W,W,_],
                [_,W,W,_,W,_,W,_,_,_,_,_],
                [_,_,W,_,_,_,W,_,W,W,_,W],
                [W,_,_,_,W,_,W,_,W,_,_,_],
                [_,_,W,_,W,_,_,_,_,_,W,_],
                [_,W,W,_,W,W,W,_,W,_,_,E],
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
