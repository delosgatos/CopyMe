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
        musicEnabled = Storage.get('music', true);
        // Resume AudioContext on first user interaction
        document.addEventListener('touchstart', resumeCtx, { once: true });
        document.addEventListener('click', resumeCtx, { once: true });
    }

    function resumeCtx() {
        const c = getCtx();
        if (c.state === 'suspended') {
            c.resume().then(() => {
                if (musicEnabled && !musicPlaying) startMusic();
            });
        } else {
            if (musicEnabled && !musicPlaying) startMusic();
        }
    }

    // ---- Background Music ----
    let musicEnabled = true;
    let musicPlaying = false;
    let musicInterval = null;
    let nextNoteTime = 0;
    
    // Simple pentatonic scale for pleasant retro loop
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    // Chiptune-style arpeggio pattern
    const melody = [0, 2, 4, 5, 4, 2, 1, 3, 5, 6, 5, 3, 2, 4, 6, 7, 6, 4, 3, 5, 7, 5, 4, 2];
    let noteIdx = 0;

    function toggleMusic() {
        musicEnabled = !musicEnabled;
        Storage.set('music', musicEnabled);
        if (musicEnabled) {
            startMusic();
        } else {
            stopMusic();
        }
        return musicEnabled;
    }

    function startMusic() {
        if (!enabled || !musicEnabled || musicPlaying) return;
        const c = getCtx();
        if (c.state === 'suspended') return;

        musicPlaying = true;
        nextNoteTime = c.currentTime + 0.1;
        scheduleMusic();
    }

    function scheduleMusic() {
        if (!musicPlaying) return;
        const c = getCtx();
        
        // Schedule notes slightly ahead
        while (nextNoteTime < c.currentTime + 0.2) {
            const noteIndex = melody[noteIdx];
            const freq = scale[noteIndex];
            
            // Bassline on every 4th note
            if (noteIdx % 4 === 0) {
                const bassOsc = c.createOscillator();
                const bassGain = c.createGain();
                bassOsc.type = 'triangle';
                bassOsc.frequency.value = freq / 2; // Octave lower
                bassGain.gain.setValueAtTime(0.06, nextNoteTime);
                bassGain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.3);
                bassOsc.connect(bassGain);
                bassGain.connect(c.destination);
                bassOsc.start(nextNoteTime);
                bassOsc.stop(nextNoteTime + 0.3);
            }

            // Melody
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            
            // Subtle tremolo/volume
            gain.gain.setValueAtTime(0.02, nextNoteTime);
            gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.12);
            
            osc.connect(gain);
            gain.connect(c.destination);
            
            osc.start(nextNoteTime);
            osc.stop(nextNoteTime + 0.12);
            
            noteIdx = (noteIdx + 1) % melody.length;
            nextNoteTime += 0.15; // 150ms step (100 BPM 16th notes approx)
        }
        
        musicInterval = setTimeout(scheduleMusic, 50);
    }

    function stopMusic() {
        musicPlaying = false;
        if (musicInterval) clearTimeout(musicInterval);
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

    // Heartbeat for danger proximity
    let lastHeartbeat = 0;
    function heartbeat(intensity) {
        if (!enabled) return;
        const now = Date.now();
        const interval = Math.max(200, 600 - intensity * 400); // faster when closer
        if (now - lastHeartbeat < interval) return;
        lastHeartbeat = now;
        const c = getCtx();
        // Double thump
        const t = c.currentTime;
        for (let i = 0; i < 2; i++) {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.value = 60 + i * 15;
            gain.gain.setValueAtTime(0.08 * intensity, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.12);
        }
    }

    function isMusicPlaying() {
        return musicEnabled;
    }

    return {
        init, enable, disable, toggle, toggleMusic, startMusic, stopMusic, isMusicPlaying,
        pixelPlace, pixelErase, error, undo, hint, complete, click, fill, heartbeat
    };
})();
