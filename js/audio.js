/* ============================================
   SFX — 8-bit retro sounds via Web Audio API
   (named SFX to avoid overriding window.Audio)
   ============================================ */

const SFX = (() => {
    let ctx = null;
    let enabled = true;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function enable() { enabled = true; Storage.set('audio', true); }
    function disable() { enabled = false; Storage.set('audio', false); }
    function toggle() { enabled ? disable() : enable(); }

    function init() {
        enabled = Storage.get('audio', true);
        // Resume AudioContext on first user interaction
        document.addEventListener('touchstart', resumeCtx, { once: true });
        document.addEventListener('click', resumeCtx, { once: true });
    }

    function resumeCtx() {
        const c = getCtx();
        if (c.state === 'suspended') c.resume();
    }

    // ---- Sound generators ----

    function playTone(freq, duration, type = 'square', volume = 0.15) {
        if (!enabled) return;
        try {
            const c = getCtx();
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(c.currentTime);
            osc.stop(c.currentTime + duration);
        } catch {}
    }

    // Pixel placement — slight pitch variation based on color
    function pixelPlace(colorIndex = 0) {
        const baseFreq = 440 + (colorIndex * 40);
        playTone(baseFreq, 0.08, 'square', 0.1);
    }

    // Pixel erase
    function pixelErase() {
        playTone(220, 0.1, 'sawtooth', 0.08);
    }

    // Error sound
    function error() {
        playTone(150, 0.15, 'sawtooth', 0.12);
        setTimeout(() => playTone(120, 0.2, 'sawtooth', 0.1), 100);
    }

    // Undo
    function undo() {
        playTone(330, 0.06, 'triangle', 0.1);
    }

    // Hint
    function hint() {
        playTone(660, 0.1, 'sine', 0.12);
        setTimeout(() => playTone(880, 0.15, 'sine', 0.1), 100);
    }

    // Level complete — little melody
    function complete(stars) {
        const melodies = {
            1: [392, 440],
            2: [392, 440, 523],
            3: [392, 440, 523, 659, 784]
        };
        const notes = melodies[stars] || melodies[1];
        notes.forEach((freq, i) => {
            setTimeout(() => playTone(freq, 0.2, 'square', 0.12), i * 120);
        });
    }

    // Button click
    function click() {
        playTone(520, 0.04, 'square', 0.08);
    }

    // Fill tool
    function fill() {
        playTone(300, 0.05, 'square', 0.08);
        setTimeout(() => playTone(400, 0.05, 'square', 0.08), 40);
        setTimeout(() => playTone(500, 0.08, 'square', 0.08), 80);
    }

    return {
        init, enable, disable, toggle,
        pixelPlace, pixelErase, error, undo, hint, complete, click, fill
    };
})();
