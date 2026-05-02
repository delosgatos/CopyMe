/* ============================================
   CanvasRenderer — Pixel grid rendering
   Renders both original and player canvases
   ============================================ */

const CanvasRenderer = (() => {
    // Render a pixel grid onto a canvas
    // grid: 2D array of color indices
    // palette: array of color strings
    // canvas: HTMLCanvasElement
    // options: { showGrid, cellSize, emptyColor, highlightCells }
    function render(canvas, grid, palette, options = {}) {
        const {
            showGrid = true,
            cellSize = null,
            emptyColor = '#1a1a2e',
            highlightCells = null, // [{x, y, color}]
            checkerboard = false,
        } = options;

        const size = grid.length;
        const wrapper = canvas.parentElement;
        const maxW = wrapper.clientWidth - 4;
        const maxH = wrapper.clientHeight - 4;
        const cs = cellSize || Math.floor(Math.min(maxW, maxH) / size);
        const totalSize = cs * size;

        canvas.width = totalSize;
        canvas.height = totalSize;
        canvas.style.width = totalSize + 'px';
        canvas.style.height = totalSize + 'px';

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Draw pixels
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const colorIdx = grid[y][x];
                const color = (colorIdx !== null && colorIdx !== undefined && colorIdx >= 0)
                    ? (palette[colorIdx] || emptyColor)
                    : emptyColor;

                if (color === emptyColor && checkerboard) {
                    // Checkerboard for empty cells
                    const isLight = (x + y) % 2 === 0;
                    ctx.fillStyle = isLight ? '#1e1e38' : '#16162e';
                } else {
                    ctx.fillStyle = color;
                }
                ctx.fillRect(x * cs, y * cs, cs, cs);
            }
        }

        // Grid lines
        if (showGrid && cs >= 4) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= size; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cs + 0.5, 0);
                ctx.lineTo(i * cs + 0.5, totalSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * cs + 0.5);
                ctx.lineTo(totalSize, i * cs + 0.5);
                ctx.stroke();
            }
        }

        // Highlight cells (for hints, errors)
        if (highlightCells && highlightCells.length > 0) {
            highlightCells.forEach(({ x, y, color: hColor }) => {
                ctx.strokeStyle = hColor || '#e2b714';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
            });
        }
    }

    // Get grid coordinates from canvas pixel position
    function getGridPos(canvas, clientX, clientY, gridSize) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const px = (clientX - rect.left) * scaleX;
        const py = (clientY - rect.top) * scaleY;
        const cellSize = canvas.width / gridSize;
        const gx = Math.floor(px / cellSize);
        const gy = Math.floor(py / cellSize);
        if (gx < 0 || gx >= gridSize || gy < 0 || gy >= gridSize) return null;
        return { x: gx, y: gy };
    }

    // Get screen position of a grid cell center (for effects)
    function getCellScreenPos(canvas, gx, gy, gridSize) {
        const rect = canvas.getBoundingClientRect();
        const cellW = rect.width / gridSize;
        const cellH = rect.height / gridSize;
        return {
            x: rect.left + gx * cellW + cellW / 2,
            y: rect.top + gy * cellH + cellH / 2
        };
    }

    // Render a mini preview of a level (for level select cards)
    function renderPreview(canvas, grid, palette, previewSize = 64) {
        const size = grid.length;
        const cs = Math.floor(previewSize / size);
        canvas.width = cs * size;
        canvas.height = cs * size;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                ctx.fillStyle = palette[grid[y][x]] || '#1a1a2e';
                ctx.fillRect(x * cs, y * cs, cs, cs);
            }
        }
    }

    return { render, getGridPos, getCellScreenPos, renderPreview };
})();
