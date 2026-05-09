/* ============================================
   Endless Mode — Infinite procedural levels
   with escalating difficulty
   ============================================ */

const EndlessMode = (() => {
    const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12 };

    let currentWave = 0;
    let totalCoins = 0;

    function mulberry32(a) {
        return function() {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function generateMaze(size, rand) {
        const grid = [];
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = C.WALL;
            }
        }

        const visited = [];
        for (let y = 0; y < size; y++) {
            visited[y] = new Array(size).fill(false);
        }

        const dirs = [[0, 2], [2, 0], [0, -2], [-2, 0]];

        function carve(x, y) {
            visited[y][x] = true;
            grid[y][x] = C.EMPTY;
            const shuffled = dirs.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            for (const [dx, dy] of shuffled) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[ny][nx]) {
                    grid[y + dy/2][x + dx/2] = C.EMPTY;
                    carve(nx, ny);
                }
            }
        }
        carve(1, 1);
        return grid;
    }

    function addExtraPassages(grid, size, rand, count) {
        let added = 0, attempts = 0;
        while (added < count && attempts < count * 10) {
            attempts++;
            const x = 1 + Math.floor(rand() * (size - 2));
            const y = 1 + Math.floor(rand() * (size - 2));
            if (grid[y][x] === C.WALL) {
                let n = 0;
                if (y > 0 && grid[y-1][x] !== C.WALL) n++;
                if (y < size-1 && grid[y+1][x] !== C.WALL) n++;
                if (x > 0 && grid[y][x-1] !== C.WALL) n++;
                if (x < size-1 && grid[y][x+1] !== C.WALL) n++;
                if (n >= 2) { grid[y][x] = C.EMPTY; added++; }
            }
        }
    }

    function addItems(grid, size, rand, numTraps, numCoins, numPowerups) {
        const empties = [];
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                if (grid[y][x] === C.EMPTY) empties.push({x, y});
            }
        }
        // Shuffle
        for (let i = empties.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [empties[i], empties[j]] = [empties[j], empties[i]];
        }

        let idx = 0;
        const types = [C.TRAP, C.COIN, C.SPEED, C.FREEZE, C.GHOST];
        const counts = [numTraps, numCoins];
        // Add traps and coins
        for (let t = 0; t < 2; t++) {
            for (let c = 0; c < counts[t] && idx < empties.length; c++) {
                const p = empties[idx++];
                grid[p.y][p.x] = types[t];
            }
        }
        // Add power-ups
        const powerTypes = [C.SPEED, C.FREEZE, C.GHOST];
        for (let c = 0; c < numPowerups && idx < empties.length; c++) {
            const p = empties[idx++];
            grid[p.y][p.x] = powerTypes[Math.floor(rand() * powerTypes.length)];
        }
    }

    function reset() {
        currentWave = 0;
        totalCoins = 0;
    }

    function generateWave(wave) {
        currentWave = wave;
        const seed = 42424242 + wave * 7919; // deterministic per wave
        const rand = mulberry32(seed);

        // Difficulty ramps up linearly
        const difficulty = Math.min(wave / 20, 1); // maxes at wave 20

        // Size: 7 → 17 (always odd)
        const rawSize = 7 + Math.floor(difficulty * 10);
        const size = rawSize % 2 === 0 ? rawSize + 1 : rawSize;

        const grid = generateMaze(size, rand);
        addExtraPassages(grid, size, rand, Math.floor(size * 0.6 + wave * 0.3));

        // Start and exit
        grid[1][1] = C.START;
        grid[size - 2][size - 2] = C.EXIT;

        // Items scale with difficulty
        const numTraps = 1 + Math.floor(wave * 0.8);
        const numCoins = 2 + Math.floor(wave * 0.5);
        const numPowerups = wave >= 3 ? 1 + Math.floor(difficulty * 2) : 0;
        addItems(grid, size, rand, Math.min(numTraps, 12), Math.min(numCoins, 10), Math.min(numPowerups, 3));

        // Speed ramps up
        const runnerSpeed = Math.max(140, 260 - wave * 8);
        const chaserSpeed = Math.max(180, 380 - wave * 12);
        const chaserDelay = Math.max(1000, 3000 - wave * 150);
        const chasers = wave >= 5 ? (wave >= 12 ? 3 : 2) : 1;

        return {
            id: 'endless_' + wave,
            name: {
                ru: `♾️ Волна ${wave}`,
                en: `♾️ Wave ${wave}`,
            },
            size,
            chaserDelay,
            chaserSpeed,
            runnerSpeed,
            chasers,
            grid,
        };
    }

    function getCurrentWave() {
        return currentWave;
    }

    function addCoins(n) {
        totalCoins += n;
    }

    function getTotalCoins() {
        return totalCoins;
    }

    function getHighScore() {
        return Storage.get('endless_highscore', 0);
    }

    function saveHighScore(wave) {
        const current = getHighScore();
        if (wave > current) {
            Storage.set('endless_highscore', wave);
            return true; // new record
        }
        return false;
    }

    return { reset, generateWave, getCurrentWave, addCoins, getTotalCoins, getHighScore, saveHighScore };
})();
