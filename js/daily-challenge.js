/* ============================================
   DailyChallenge — Procedural daily maze
   New maze every day, streak tracking
   ============================================ */

const DailyChallenge = (() => {
    const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12 };

    // Simple seeded random (mulberry32)
    function mulberry32(seed) {
        return function() {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // Get today's seed from date string
    function getTodaySeed() {
        const d = new Date();
        const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    // Generate a maze using recursive backtracker
    function generateMaze(size, rand) {
        // Initialize all as walls
        const grid = Array.from({ length: size }, () => new Array(size).fill(C.WALL));

        // Carve passages (only on odd cells)
        const visited = Array.from({ length: size }, () => new Array(size).fill(false));
        const dirs = [[0,-2],[0,2],[-2,0],[2,0]];

        function carve(x, y) {
            visited[y][x] = true;
            grid[y][x] = C.EMPTY;

            // Shuffle directions
            const shuffled = dirs.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            for (const [dx, dy] of shuffled) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[ny][nx]) {
                    // Carve wall between
                    grid[y + dy/2][x + dx/2] = C.EMPTY;
                    carve(nx, ny);
                }
            }
        }

        carve(1, 1);

        return grid;
    }

    // Add extra openings to make maze less linear
    function addExtraPassages(grid, size, rand, count) {
        let added = 0;
        let attempts = 0;
        while (added < count && attempts < count * 10) {
            attempts++;
            const x = 1 + Math.floor(rand() * (size - 2));
            const y = 1 + Math.floor(rand() * (size - 2));
            if (grid[y][x] === C.WALL) {
                // Check if removing this wall connects two passages
                let passableNeighbors = 0;
                if (y > 0 && grid[y-1][x] !== C.WALL) passableNeighbors++;
                if (y < size-1 && grid[y+1][x] !== C.WALL) passableNeighbors++;
                if (x > 0 && grid[y][x-1] !== C.WALL) passableNeighbors++;
                if (x < size-1 && grid[y][x+1] !== C.WALL) passableNeighbors++;
                if (passableNeighbors >= 2) {
                    grid[y][x] = C.EMPTY;
                    added++;
                }
            }
        }
    }

    // Place traps, coins, and power-ups
    function addItems(grid, size, rand, numTraps, numCoins, numPowerups) {
        const empties = [];
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                if (grid[y][x] === C.EMPTY) empties.push({x, y});
            }
        }
        // Shuffle empties
        for (let i = empties.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [empties[i], empties[j]] = [empties[j], empties[i]];
        }

        const powerupTypes = [C.SPEED, C.FREEZE, C.GHOST];
        let placed = 0;
        for (const pos of empties) {
            if (placed < numTraps) {
                grid[pos.y][pos.x] = C.TRAP;
                placed++;
            } else if (placed < numTraps + numCoins) {
                grid[pos.y][pos.x] = C.COIN;
                placed++;
            } else if (placed < numTraps + numCoins + numPowerups) {
                grid[pos.y][pos.x] = powerupTypes[Math.floor(rand() * powerupTypes.length)];
                placed++;
            } else {
                break;
            }
        }
    }

    // Generate today's level
    function generateToday() {
        const seed = getTodaySeed();
        const rand = mulberry32(seed);

        // Difficulty scales with day-of-year (cycle every 30 days)
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const cycle = dayOfYear % 30;
        const difficulty = Math.min(cycle / 30, 1); // 0 to 1

        // Size: 8 to 16 based on difficulty
        const rawSize = 8 + Math.floor(difficulty * 8);
        const size = rawSize % 2 === 0 ? rawSize + 1 : rawSize; // Must be odd for maze gen

        const grid = generateMaze(size, rand);

        // Add extra passages for more interesting layout
        addExtraPassages(grid, size, rand, Math.floor(size * 0.8));

        // Place start and exit far apart
        grid[1][1] = C.START;
        grid[size - 2][size - 2] = C.EXIT;

        // Add items including power-ups
        const numTraps = 2 + Math.floor(difficulty * 6);
        const numCoins = 2 + Math.floor(difficulty * 4);
        const numPowerups = 1 + Math.floor(difficulty * 2); // 1-3 power-ups
        addItems(grid, size, rand, numTraps, numCoins, numPowerups);

        // Speeds get harder with difficulty
        const runnerSpeed = 250 - Math.floor(difficulty * 80);  // 250 → 170
        const chaserSpeed = 350 - Math.floor(difficulty * 100);  // 350 → 250
        const chaserDelay = 2500 - Math.floor(difficulty * 1000); // 2500 → 1500
        const chasers = difficulty > 0.6 ? 2 : 1;

        return {
            id: 'daily_' + getTodayKey(),
            name: { ru: '🗓 Ежедневный вызов', en: '🗓 Daily Challenge' },
            size,
            chaserDelay,
            chaserSpeed,
            runnerSpeed,
            chasers,
            grid,
        };
    }

    // Streak management
    function getStreak() {
        return Storage.get('daily_streak', { count: 0, lastDate: null });
    }

    function isCompletedToday() {
        const progress = Storage.getEscapeProgress('daily_' + getTodayKey());
        return progress.completed;
    }

    function completeToday() {
        const streak = getStreak();
        const today = getTodayKey();
        const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        })();

        if (streak.lastDate === today) return streak; // Already counted

        let newCount = 1;
        if (streak.lastDate === yesterday) {
            newCount = streak.count + 1; // Streak continues!
        }

        const newStreak = { count: newCount, lastDate: today };
        Storage.set('daily_streak', newStreak);
        return newStreak;
    }

    // Time until next challenge
    function getTimeUntilNext() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const diff = tomorrow - now;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return { hours, mins, total: diff };
    }

    return { generateToday, getStreak, isCompletedToday, completeToday, getTimeUntilNext, getTodayKey };
})();
