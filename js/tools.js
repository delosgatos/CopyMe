/* ============================================
   Tools — Drawing tools (pencil, fill, eraser, eyedropper, undo, hint)
   ============================================ */

const Tools = (() => {
    let currentTool = 'pencil';
    let undoStack = [];
    const MAX_UNDO = 50;

    function init() {
        currentTool = 'pencil';
        undoStack = [];
        updateUI();
    }

    function setCurrent(tool) {
        if (tool === 'undo') {
            undo();
            return;
        }
        if (tool === 'hint') {
            // Handled by Game
            return;
        }
        currentTool = tool;
        updateUI();
        SFX.click();
    }

    function getCurrent() {
        return currentTool;
    }

    function updateUI() {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            const tool = btn.dataset.tool;
            btn.classList.toggle('active', tool === currentTool);
        });
    }

    // Save state for undo
    function pushUndo(grid) {
        const snapshot = grid.map(row => [...row]);
        undoStack.push(snapshot);
        if (undoStack.length > MAX_UNDO) {
            undoStack.shift();
        }
    }

    function undo() {
        if (undoStack.length === 0) {
            SFX.error();
            return null;
        }
        SFX.undo();
        return undoStack.pop();
    }

    function canUndo() {
        return undoStack.length > 0;
    }

    function clearUndo() {
        undoStack = [];
    }

    // Flood fill algorithm
    function floodFill(grid, x, y, newColorIdx) {
        const size = grid.length;
        const targetColor = grid[y][x];
        if (targetColor === newColorIdx) return grid; // Same color, no-op

        const newGrid = grid.map(row => [...row]);
        const stack = [[x, y]];
        const visited = new Set();

        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            if (visited.has(key)) continue;
            if (cx < 0 || cx >= size || cy < 0 || cy >= size) continue;
            if (newGrid[cy][cx] !== targetColor) continue;

            visited.add(key);
            newGrid[cy][cx] = newColorIdx;

            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }

        return newGrid;
    }

    return { init, setCurrent, getCurrent, pushUndo, undo, canUndo, clearUndo, floodFill };
})();
