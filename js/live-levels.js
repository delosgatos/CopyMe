/* ============================================
   Live Levels — Maze data for Выживание mode
   ============================================ */

const LiveLevels = (() => {
    const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9 };
    const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT;

    const levels = [
        // Level 1: Introduction to live drawing. Just run away from the chaser in a simple zig-zag.
        {
            id: 'live_01',
            name: { ru: 'Беги, не отпускай!', en: 'Run, dont let go!' },
            size: 8,
            chaserDelay: 1000,
            chaserSpeed: 250,
            runnerSpeed: 200,
            chasers: 1,
            grid: [
                [S,_,_,W,_,_,_,E],
                [W,W,_,W,_,W,W,W],
                [_,_,_,W,_,_,_,_],
                [_,W,W,W,W,W,W,_],
                [_,_,_,_,_,_,W,_],
                [W,W,W,W,W,_,W,_],
                [_,_,_,_,_,_,_,_],
                [_,W,W,W,W,W,W,W],
            ],
        },
        // Level 2: Wide area with traps. Player must slalom around fire.
        {
            id: 'live_02',
            name: { ru: 'Слалом', en: 'Slalom' },
            size: 10,
            chaserDelay: 1200,
            chaserSpeed: 230,
            runnerSpeed: 180,
            chasers: 1,
            grid: [
                [S,_,_,_,_,_,_,_,_,_],
                [_,T,_,T,_,T,_,T,_,_],
                [_,_,_,_,_,_,_,_,_,_],
                [_,_,T,_,T,_,T,_,T,_],
                [_,_,_,_,_,_,_,_,_,_],
                [_,T,_,T,_,T,_,T,_,_],
                [_,_,_,_,_,_,_,_,_,_],
                [_,_,T,_,T,_,T,_,T,_],
                [_,_,_,_,_,_,_,_,_,E],
                [_,_,_,_,_,_,_,_,_,_],
            ],
        },
        // Level 3: Dual chasers, tight corridors.
        {
            id: 'live_03',
            name: { ru: 'В тисках', en: 'Pincers' },
            size: 10,
            chaserDelay: 1000,
            chaserSpeed: 250,
            runnerSpeed: 150,
            chasers: 2,
            grid: [
                [S,_,_,_,_,_,W,_,_,E],
                [_,W,W,W,W,_,W,_,W,W],
                [_,W,_,_,_,_,W,_,_,_],
                [_,W,_,W,W,W,W,W,W,_],
                [_,W,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,_,W,_],
                [_,_,_,_,_,_,_,_,W,_],
                [_,W,W,W,W,W,W,W,W,_],
                [_,_,_,_,_,_,_,_,_,_],
                [W,W,W,W,W,W,W,W,W,W],
            ],
        }
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
