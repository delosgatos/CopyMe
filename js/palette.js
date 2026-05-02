/* ============================================
   Palette — Color palette UI with numbered mode
   ============================================ */

const Palette = (() => {
    let colors = [];
    let selectedIndex = 0;
    let onSelect = null;
    let showNumbers = false;

    function init(paletteColors, callback, numberedMode = false) {
        colors = paletteColors;
        selectedIndex = 0;
        onSelect = callback;
        showNumbers = numberedMode;
        renderPalette();
    }

    function renderPalette() {
        const container = document.getElementById('palette-scroll');
        container.innerHTML = '';
        colors.forEach((color, i) => {
            const el = document.createElement('div');
            el.className = 'palette-color' + (i === selectedIndex ? ' active' : '');
            el.style.backgroundColor = color;
            el.dataset.index = i;

            // Show number overlay in "By Numbers" mode
            if (showNumbers) {
                const num = document.createElement('span');
                num.className = 'palette-number';
                num.textContent = i;
                // Auto-contrast: light text on dark, dark on light
                const brightness = getColorBrightness(color);
                num.style.color = brightness > 128 ? '#000' : '#fff';
                el.appendChild(num);
            }

            el.addEventListener('click', () => select(i));
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                select(i);
            }, { passive: false });
            container.appendChild(el);
        });
    }

    function select(index) {
        if (index < 0 || index >= colors.length) return;
        selectedIndex = index;
        document.querySelectorAll('.palette-color').forEach((el, i) => {
            el.classList.toggle('active', i === index);
        });
        SFX.click();
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(10);
        if (onSelect) onSelect(index, colors[index]);
    }

    function getSelected() {
        return { index: selectedIndex, color: colors[selectedIndex] };
    }

    function getColor(index) {
        return colors[index] || null;
    }

    function selectByColor(color) {
        const idx = colors.indexOf(color);
        if (idx >= 0) select(idx);
    }

    // Helper: get brightness of a hex color
    function getColorBrightness(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    }

    return { init, select, getSelected, getColor, selectByColor };
})();
