/* ============================================
   Live Levels — Maze data for Выживание mode
   ============================================ */

const LiveLevels = (() => {
    const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9 };
    const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT;

    const levels = [
        // Level 1: Simple corridor — tutorial for live drawing
        {
            id: 'live_01',
            name: { ru: 'Беги, не отпускай!', en: 'Run, dont let go!' },
            size: 7,
            chaserDelay: 4000,
            chaserSpeed: 350,
            runnerSpeed: 200,
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
        // Level 2: Slalom — dodge the traps
        {
            id: 'live_02',
            name: { ru: 'Слалом', en: 'Slalom' },
            size: 8,
            chaserDelay: 3500,
            chaserSpeed: 300,
            runnerSpeed: 180,
            chasers: 1,
            grid: [
                [S,_,_,_,_,_,_,_],
                [_,_,T,_,_,T,_,_],
                [_,_,_,_,_,_,_,_],
                [_,T,_,_,T,_,_,T],
                [_,_,_,_,_,_,_,_],
                [_,_,T,_,_,T,_,_],
                [_,_,_,_,_,_,_,_],
                [_,_,_,_,_,_,_,E],
            ],
        },
        // Level 3: Corridor sprint — no wide open areas
        {
            id: 'live_03',
            name: { ru: 'Коридоры', en: 'Corridors' },
            size: 8,
            chaserDelay: 3000,
            chaserSpeed: 280,
            runnerSpeed: 170,
            chasers: 1,
            grid: [
                [S,_,_,_,W,_,_,_],
                [W,W,W,_,W,_,W,_],
                [_,_,_,_,_,_,W,_],
                [_,W,W,W,W,_,W,_],
                [_,W,_,_,_,_,_,_],
                [_,W,_,W,W,W,W,_],
                [_,_,_,_,_,_,_,_],
                [W,W,W,W,W,W,_,E],
            ],
        },
        // Level 4: Two chasers — wide open
        {
            id: 'live_04',
            name: { ru: 'Два охотника', en: 'Two Hunters' },
            size: 8,
            chaserDelay: 2500,
            chaserSpeed: 260,
            runnerSpeed: 160,
            chasers: 2,
            grid: [
                [S,_,_,_,_,_,_,_],
                [_,_,_,W,_,_,_,_],
                [_,_,_,W,_,_,_,_],
                [_,W,_,_,_,_,W,_],
                [_,W,_,_,_,_,W,_],
                [_,_,_,_,W,_,_,_],
                [_,_,_,_,W,_,_,_],
                [_,_,_,_,_,_,_,E],
            ],
        },
        // Level 5: Gauntlet — traps and 2 chasers
        {
            id: 'live_05',
            name: { ru: 'Испытание', en: 'Gauntlet' },
            size: 10,
            chaserDelay: 2000,
            chaserSpeed: 250,
            runnerSpeed: 150,
            chasers: 2,
            grid: [
                [S,_,_,_,_,W,_,_,_,_],
                [_,_,W,_,_,W,_,W,_,_],
                [_,_,W,_,_,_,_,W,_,_],
                [_,_,_,_,W,_,_,_,_,_],
                [_,W,_,_,W,_,_,_,W,_],
                [_,W,_,_,_,_,T,_,W,_],
                [_,_,_,W,_,_,_,_,_,_],
                [_,_,_,W,_,W,_,_,_,_],
                [_,_,_,_,_,W,_,_,T,_],
                [_,_,_,_,_,_,_,_,_,E],
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
