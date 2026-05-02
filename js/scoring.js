/* ============================================
   Scoring — Compare player grid with original
   ============================================ */

const Scoring = (() => {

    // Compare two grids and return detailed results
    function evaluate(playerGrid, originalGrid) {
        const size = originalGrid.length;
        let correct = 0;
        let wrong = 0;
        let empty = 0;
        const total = size * size;
        const wrongCells = [];
        const emptyCells = [];

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const expected = originalGrid[y][x];
                const actual = playerGrid[y][x];

                if (actual === null || actual === undefined || actual < 0) {
                    empty++;
                    emptyCells.push({ x, y });
                } else if (actual === expected) {
                    correct++;
                } else {
                    wrong++;
                    wrongCells.push({ x, y });
                }
            }
        }

        const accuracy = total > 0 ? correct / total : 0;
        const stars = getStars(accuracy);

        return {
            correct,
            wrong,
            empty,
            total,
            accuracy,
            percentage: Math.round(accuracy * 100),
            stars,
            wrongCells,
            emptyCells,
            isPerfect: accuracy === 1,
        };
    }

    // Calculate percentage match (for live progress bar)
    function getProgress(playerGrid, originalGrid) {
        const size = originalGrid.length;
        let correct = 0;
        let filled = 0;
        const total = size * size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const actual = playerGrid[y][x];
                if (actual !== null && actual !== undefined && actual >= 0) {
                    filled++;
                    if (actual === originalGrid[y][x]) {
                        correct++;
                    }
                }
            }
        }

        return {
            filled,
            correct,
            total,
            filledPercent: Math.round((filled / total) * 100),
            correctPercent: Math.round((correct / total) * 100),
        };
    }

    function getStars(accuracy) {
        if (accuracy >= 1.0) return 3;
        if (accuracy >= 0.9) return 2;
        if (accuracy >= 0.75) return 1;
        return 0;
    }

    // Get result title based on stars
    function getResultTitle(stars) {
        const titles = {
            3: I18n.t('result.perfect'),
            2: I18n.t('result.great'),
            1: I18n.t('result.good'),
            0: I18n.t('result.try_again'),
        };
        return titles[stars] || titles[0];
    }

    // Format time in mm:ss
    function formatTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    return { evaluate, getProgress, getStars, getResultTitle, formatTime };
})();
