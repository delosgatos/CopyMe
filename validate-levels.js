#!/usr/bin/env node
const C = { EMPTY: 0, WALL: 1, TRAP: 2, KEY: 3, COIN: 4, DOOR: 5, START: 8, EXIT: 9, SPEED: 10, FREEZE: 11, GHOST: 12, PORTAL_A: 13, PORTAL_B: 14, SLOW: 15, PORTAL_C: 16, PORTAL_D: 17 };

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
        queue = next; pathLen++;
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
    const label = `[${mode}] ${id} "${name.ru}"`;
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
    const basic = bfs(grid, size, start.x, start.y, target.x, target.y, false);
    if (!basic.reachable) issues.push(`NO PATH S→${exit ? 'E' : 'D'} — IMPOSSIBLE!`);
    const safe = bfs(grid, size, start.x, start.y, target.x, target.y, true);
    if (!safe.reachable && basic.reachable) issues.push(`Only path goes THROUGH traps`);
    if (door && !exit) {
        if (!key) { issues.push('DOOR but no KEY!'); }
        else {
            const toKey = bfs(grid, size, start.x, start.y, key.x, key.y, true);
            if (!toKey.reachable) issues.push(`Cannot reach KEY safely`);
            const keyToDoor = bfs(grid, size, key.x, key.y, door.x, door.y, true);
            if (!keyToDoor.reachable) issues.push(`Cannot reach DOOR from KEY`);
        }
    }
    return { label, issues, path: safe.reachable ? safe.distance : basic.distance, chasers: level.chasers || 0, types: level.chaserTypes || [] };
}

const _ = C.EMPTY, W = C.WALL, T = C.TRAP, K = C.KEY, O = C.COIN, D = C.DOOR, S = C.START, E = C.EXIT, SP = C.SPEED, FR = C.FREEZE, GH = C.GHOST, PA = C.PORTAL_A, PB = C.PORTAL_B, SL = C.SLOW, PC = C.PORTAL_C, PD = C.PORTAL_D;

// Load actual levels from file
const fs = require('fs');
let levelsCode = fs.readFileSync('/Users/admin/Documents/_projects/CopyMe/js/escape-levels.js', 'utf8');
const Storage = { getEscapeProgress: () => ({ completed: true }) };
// Replace const with var so eval can export it
levelsCode = levelsCode.replace('const EscapeLevels', 'var EscapeLevels');
eval(levelsCode);
const levels = EscapeLevels.getAll();

console.log('\n========== CopyMe Level Validator v3 ==========\n');
let ok = 0, fail = 0;
for (const l of levels) {
    const r = validateLevel(l, 'ESC');
    if (r.issues.length) { console.log(`❌ ${r.label}`); r.issues.forEach(i => console.log(`   └─ ${i}`)); fail++; }
    else { 
        const extras = r.types.length ? ` [${r.types.join(',')}]` : '';
        console.log(`✅ ${r.label} — ${l.size}×${l.size}, path: ${r.path}, chasers: ${r.chasers}${extras}`);
        ok++;
    }
}
console.log(`\n  Results: ${ok} OK, ${fail} FAILED\n`);
if (fail > 0) process.exit(1);
