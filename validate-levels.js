#!/usr/bin/env node
const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12 };

function bfs(grid, size, sx, sy, tx, ty, avoidTraps = false) {
    const visited = Array.from({ length: size }, () => new Array(size).fill(false));
    visited[sy][sx] = true;
    let queue = [{ x: sx, y: sy }];
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    let pathLen = 0;
    while (queue.length > 0) {
        const next = [];
        for (const cur of queue) {
            if (cur.x === tx && cur.y === ty) return { reachable: true, distance: pathLen };
            for (const [dx, dy] of dirs) {
                const nx = cur.x + dx, ny = cur.y + dy;
                if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
                if (visited[ny][nx]) continue;
                const cell = grid[ny][nx];
                if (cell === C.WALL) continue;
                if (avoidTraps && cell === C.TRAP) continue;
                visited[ny][nx] = true;
                next.push({ x: nx, y: ny });
            }
        }
        queue = next;
        pathLen++;
    }
    return { reachable: false, distance: -1 };
}

function findCell(grid, size, type) {
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
            if (grid[y][x] === type) return { x, y };
    return null;
}

function validateLevel(level, mode) {
    const { grid, size, id, name } = level;
    const label = `[${mode}] ${id} "${name.ru || name.en}"`;
    const issues = [];

    if (grid.length !== size) issues.push(`Grid height ${grid.length} != size ${size}`);
    for (let y = 0; y < grid.length; y++)
        if (grid[y].length !== size) issues.push(`Row ${y} width ${grid[y].length} != size ${size}`);

    const start = findCell(grid, size, C.START);
    const exit = findCell(grid, size, C.EXIT);
    const door = findCell(grid, size, C.DOOR);
    const key = findCell(grid, size, C.KEY);
    const target = exit || door;

    if (!start) { issues.push('No START'); return { label, issues }; }
    if (!target) { issues.push('No EXIT or DOOR'); return { label, issues }; }

    // Basic reachability
    const basic = bfs(grid, size, start.x, start.y, target.x, target.y, false);
    if (!basic.reachable) issues.push(`NO PATH S→${exit ? 'E' : 'D'} — IMPOSSIBLE!`);

    // Safe path avoiding traps
    const safe = bfs(grid, size, start.x, start.y, target.x, target.y, true);
    if (!safe.reachable && basic.reachable)
        issues.push(`Only path goes THROUGH traps (len ${basic.distance})`);

    // Key+Door
    if (door && !exit) {
        if (!key) { issues.push('DOOR but no KEY!'); }
        else {
            const toKey = bfs(grid, size, start.x, start.y, key.x, key.y, true);
            if (!toKey.reachable) issues.push(`Cannot reach KEY safely`);
            const keyToDoor = bfs(grid, size, key.x, key.y, door.x, door.y, true);
            if (!keyToDoor.reachable) issues.push(`Cannot reach DOOR from KEY`);
        }
    }

    return { label, issues, path: safe.reachable ? safe.distance : basic.distance, chasers: level.chasers || 0 };
}

const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT, SP = C.SPEED, FR = C.FREEZE, GH = C.GHOST;

// ===== ESCAPE =====
const escape = [
    { id:'e01', name:{ru:'Первый побег'}, size:7, chasers:1, grid:[
        [S,_,_,_,_,_,_],[W,W,W,W,W,_,W],[_,_,_,_,_,_,_],[_,W,W,W,W,W,W],[_,_,_,_,_,_,_],[W,W,W,W,W,_,W],[_,_,_,_,_,_,E]]},
    { id:'e02', name:{ru:'Монетки'}, size:7, chasers:1, grid:[
        [S,_,_,W,_,O,_],[_,W,_,W,_,W,_],[_,W,_,_,_,W,_],[_,W,W,W,_,W,_],[_,_,_,_,_,_,_],[W,W,_,W,W,W,_],[O,_,_,_,_,_,E]]},
    { id:'e03', name:{ru:'Осторожно огонь'}, size:8, chasers:1, grid:[
        [S,_,_,W,_,_,_,_],[_,W,_,W,_,W,W,_],[_,W,_,_,_,T,_,_],[_,W,W,W,_,W,W,_],[_,_,_,T,_,_,_,_],[W,W,_,W,W,W,_,W],[_,_,_,_,_,_,_,_],[_,W,W,T,W,W,_,E]]},
    { id:'e04', name:{ru:'Развилка'}, size:8, chasers:1, grid:[
        [S,_,_,_,W,_,O,_],[_,W,W,_,W,_,W,_],[_,_,_,_,_,_,W,_],[W,W,_,W,W,_,_,_],[_,_,_,_,W,W,W,_],[_,W,W,_,_,_,T,_],[_,_,W,_,W,_,W,_],[O,_,_,_,W,_,_,E]]},
    { id:'e05', name:{ru:'Найди ключ'}, size:8, chasers:1, grid:[
        [S,_,_,W,_,_,_,_],[_,W,_,W,_,W,_,K],[_,W,_,_,_,W,_,_],[_,_,_,W,_,W,W,_],[W,W,_,W,_,_,_,_],[_,_,_,_,_,W,W,W],[_,W,W,W,_,_,_,_],[_,_,_,_,_,W,W,D]]},
    { id:'e06', name:{ru:'Большой лабиринт'}, size:10, chasers:1, grid:[
        [S,_,_,W,_,_,O,_,_,_],[_,W,_,W,_,W,W,_,W,_],[_,W,_,_,_,_,_,_,W,_],[_,W,W,W,W,W,_,W,W,_],[_,_,_,_,_,_,_,_,_,_],[W,W,W,_,W,W,W,W,_,W],[_,_,_,_,W,_,_,_,_,_],[_,W,W,_,W,_,W,W,W,_],[_,_,W,_,_,_,_,_,_,_],[W,_,W,W,W,_,W,W,_,E]]},
    { id:'e07', name:{ru:'Двойная погоня'}, size:10, chasers:2, grid:[
        [S,_,_,W,_,_,_,_,W,_],[_,W,_,_,_,W,W,_,W,_],[_,W,W,W,_,W,_,_,_,_],[_,_,_,W,_,_,_,W,W,_],[W,W,_,_,_,W,_,SP,_,_],[_,_,_,W,_,W,W,W,_,W],[_,W,_,W,_,_,_,_,_,_],[_,W,_,_,_,W,W,_,W,_],[_,_,_,W,_,_,W,_,W,_],[W,_,W,W,FR,_,_,_,_,E]]},
    { id:'e08', name:{ru:'Сокровища'}, size:10, chasers:2, grid:[
        [S,_,_,W,_,_,O,_,_,_],[_,W,_,W,_,W,W,_,W,K],[_,W,_,_,_,_,_,_,_,_],[_,W,W,W,W,_,W,W,W,_],[_,_,O,_,_,_,W,_,_,_],[W,W,W,_,W,_,_,_,W,_],[O,_,_,_,W,_,W,_,W,_],[W,_,W,_,_,_,W,_,_,_],[_,_,W,W,W,_,W,W,W,_],[_,_,_,_,_,_,_,O,_,D]]},
    { id:'e09', name:{ru:'Огненный забег'}, size:10, chasers:2, grid:[
        [S,_,_,_,W,_,_,_,_,_],[W,_,W,_,W,_,W,T,W,_],[_,_,W,_,_,_,_,_,W,_],[_,W,W,W,_,W,W,_,_,_],[_,_,T,_,_,_,W,_,W,_],[W,_,W,W,W,_,_,_,W,_],[_,_,_,_,W,_,W,_,_,_],[_,W,W,_,T,_,W,W,W,_],[_,_,W,_,W,_,_,_,_,_],[W,_,_,_,W,_,W,W,_,E]]},
    { id:'e10', name:{ru:'Финальный лабиринт'}, size:12, chasers:2, grid:[
        [S,_,_,W,_,_,_,_,W,_,_,_],[_,W,_,W,_,W,W,_,W,_,W,_],[_,W,_,_,_,_,_,_,_,_,W,_],[_,W,W,W,W,W,_,W,W,_,_,_],[_,_,_,_,_,_,_,_,W,_,W,W],[W,W,W,_,W,W,W,_,_,_,_,_],[_,_,_,_,W,_,_,_,W,W,W,_],[_,W,W,_,W,_,W,_,_,_,_,_],[_,_,W,_,_,_,W,_,W,W,_,W],[W,_,_,_,W,_,W,_,W,_,_,_],[_,_,W,_,W,_,_,_,_,_,W,_],[_,W,W,_,W,W,W,_,W,_,_,E]]},
];

// ===== LIVE =====
const live = [
    { id:'l01', name:{ru:'Беги'}, size:7, chasers:1, grid:[
        [S,_,_,_,_,_,_],[W,W,W,W,W,_,W],[_,_,_,_,_,_,_],[_,W,W,W,W,W,W],[_,_,_,_,_,_,_],[W,W,W,W,W,_,W],[_,_,_,_,_,_,E]]},
    { id:'l02', name:{ru:'Слалом'}, size:8, chasers:1, grid:[
        [S,_,_,_,_,_,_,_],[_,_,T,_,_,T,_,_],[_,_,_,_,_,_,_,_],[_,T,_,_,T,_,_,T],[_,_,_,_,_,_,_,_],[_,_,T,_,_,T,_,_],[_,_,_,_,_,_,_,_],[_,_,_,_,_,_,_,E]]},
    { id:'l03', name:{ru:'Коридоры'}, size:8, chasers:1, grid:[
        [S,_,_,_,W,_,_,_],[W,W,W,_,W,_,W,_],[_,_,_,_,_,_,W,_],[_,W,W,W,W,_,W,_],[_,W,_,_,_,_,_,_],[_,W,_,W,W,W,W,_],[_,_,_,_,_,_,_,_],[W,W,W,W,W,W,_,E]]},
    { id:'l04', name:{ru:'Два охотника'}, size:8, chasers:2, grid:[
        [S,_,_,_,_,_,_,_],[_,_,_,W,_,_,_,_],[_,_,_,W,_,_,_,_],[_,W,_,_,_,_,W,_],[_,W,_,_,_,_,W,_],[_,_,_,_,W,_,_,_],[_,_,_,_,W,_,_,_],[_,_,_,_,_,_,_,E]]},
    { id:'l05', name:{ru:'Испытание'}, size:10, chasers:2, grid:[
        [S,_,_,_,_,W,_,_,_,_],[_,_,W,_,_,W,_,W,_,_],[_,_,W,_,_,_,_,W,_,_],[_,_,_,_,W,_,_,_,_,_],[_,W,_,_,W,_,_,_,W,_],[_,W,_,_,_,_,T,_,W,_],[_,_,_,W,_,_,_,_,_,_],[_,_,_,W,_,W,_,_,_,_],[_,_,_,_,_,W,_,_,T,_],[_,_,_,_,_,_,_,_,_,E]]},
];

console.log('\n========================================');
console.log('  CopyMe Level Validator v2');
console.log('========================================\n');

let ok = 0, fail = 0;

console.log('--- ESCAPE (10 levels) ---');
for (const l of escape) {
    const r = validateLevel(l, 'ESC');
    if (r.issues.length) { console.log(`❌ ${r.label}`); r.issues.forEach(i => console.log(`   └─ ${i}`)); fail++; }
    else { console.log(`✅ ${r.label} — path: ${r.path}, chasers: ${r.chasers}`); ok++; }
}

console.log('\n--- LIVE (5 levels) ---');
for (const l of live) {
    const r = validateLevel(l, 'LIVE');
    if (r.issues.length) { console.log(`❌ ${r.label}`); r.issues.forEach(i => console.log(`   └─ ${i}`)); fail++; }
    else { console.log(`✅ ${r.label} — path: ${r.path}, chasers: ${r.chasers}`); ok++; }
}

// Endless waves 1-25
function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
function generateMaze(size, rand) {
    const grid = Array.from({ length: size }, () => new Array(size).fill(1));
    const stack = [{ x: 1, y: 1 }]; grid[1][1] = 0;
    const dirs = [[0,2],[2,0],[0,-2],[-2,0]];
    while (stack.length) {
        const cur = stack[stack.length - 1];
        const shuffled = dirs.map(d => ({ d, r: rand() })).sort((a,b) => a.r - b.r).map(x => x.d);
        let moved = false;
        for (const [dx, dy] of shuffled) {
            const nx = cur.x + dx, ny = cur.y + dy;
            if (nx > 0 && nx < size-1 && ny > 0 && ny < size-1 && grid[ny][nx] === 1) {
                grid[cur.y + dy/2][cur.x + dx/2] = 0; grid[ny][nx] = 0;
                stack.push({ x: nx, y: ny }); moved = true; break;
            }
        }
        if (!moved) stack.pop();
    }
    return grid;
}
function addExtraPassages(grid, size, rand, count) {
    for (let i = 0; i < count; i++) {
        const x = 1 + Math.floor(rand() * (size - 2)), y = 1 + Math.floor(rand() * (size - 2));
        if (grid[y][x] === 1) { let adj = 0;
            if (y > 0 && grid[y-1][x] === 0) adj++; if (y < size-1 && grid[y+1][x] === 0) adj++;
            if (x > 0 && grid[y][x-1] === 0) adj++; if (x < size-1 && grid[y][x+1] === 0) adj++;
            if (adj >= 2) grid[y][x] = 0;
        }
    }
}

console.log('\n--- ENDLESS (waves 1-25) ---');
for (let w = 1; w <= 25; w++) {
    const seed = 42424242 + w * 7919, rand = mulberry32(seed);
    const diff = Math.min(w / 20, 1), raw = 7 + Math.floor(diff * 10);
    const size = raw % 2 === 0 ? raw + 1 : raw;
    const grid = generateMaze(size, rand);
    addExtraPassages(grid, size, rand, Math.floor(size * 0.6 + w * 0.3));
    grid[1][1] = C.START; grid[size-2][size-2] = C.EXIT;
    const l = { id: `endless_${w}`, name: { ru: `Волна ${w}` }, size, chasers: w >= 5 ? (w >= 12 ? 3 : 2) : 1, grid };
    const r = validateLevel(l, 'END');
    if (r.issues.length) { console.log(`❌ ${r.label}`); r.issues.forEach(i => console.log(`   └─ ${i}`)); fail++; }
    else { console.log(`✅ ${r.label} — ${size}x${size}, path: ${r.path}`); ok++; }
}

console.log('\n--- DAILY (30 days) ---');
for (let d = 0; d < 30; d++) {
    const seed = (20260509 + d) * 2654435761, rand = mulberry32(seed);
    const diff = Math.min(d / 30, 1), raw = 8 + Math.floor(diff * 8);
    const size = raw % 2 === 0 ? raw + 1 : raw;
    const grid = generateMaze(size, rand);
    addExtraPassages(grid, size, rand, Math.floor(size * 0.8));
    grid[1][1] = C.START; grid[size-2][size-2] = C.EXIT;
    const l = { id: `daily_${d}`, name: { ru: `День ${d+1}` }, size, chasers: diff > 0.6 ? 2 : 1, grid };
    const r = validateLevel(l, 'DAY');
    if (r.issues.length) { console.log(`❌ ${r.label}`); r.issues.forEach(i => console.log(`   └─ ${i}`)); fail++; }
    else { console.log(`✅ ${r.label} — ${size}x${size}, path: ${r.path}`); ok++; }
}

console.log(`\n========================================`);
console.log(`  Results: ${ok} OK, ${fail} FAILED`);
console.log(`========================================\n`);
if (fail > 0) process.exit(1);
