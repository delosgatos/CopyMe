/* ============================================
   Effects — Particles, animations, juice
   ============================================ */

const Effects = (() => {
    const container = () => document.getElementById('particles-container');

    // Spawn pixel particles at a screen position
    function pixelBurst(x, y, color, count = 6) {
        const c = container();
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle particle-pixel';
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const dist = 20 + Math.random() * 30;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            p.style.cssText = `
                left: ${x}px; top: ${y}px;
                background: ${color};
                --dx: ${dx}px; --dy: ${dy}px;
                width: ${3 + Math.random() * 4}px;
                height: ${3 + Math.random() * 4}px;
            `;
            c.appendChild(p);
            setTimeout(() => p.remove(), 800);
        }
    }

    // Star burst for level completion
    function starBurst(x, y, count = 8) {
        const c = container();
        const emojis = ['⭐', '✨', '🌟', '💫'];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle particle-star';
            const angle = (Math.PI * 2 / count) * i;
            const dist = 60 + Math.random() * 80;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist - 20;
            p.textContent = emojis[i % emojis.length];
            p.style.cssText = `
                left: ${x}px; top: ${y}px;
                --dx: ${dx}px; --dy: ${dy}px;
            `;
            c.appendChild(p);
            setTimeout(() => p.remove(), 1000);
        }
    }

    // Fireworks for 3-star completion
    function fireworks() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const x = w * 0.2 + Math.random() * w * 0.6;
                const y = h * 0.2 + Math.random() * h * 0.3;
                starBurst(x, y, 10);
                // Color bursts
                const colors = ['#e2b714', '#ff6b6b', '#4ecdc4', '#a855f7', '#3b82f6'];
                colors.forEach(color => {
                    pixelBurst(
                        x + (Math.random() - 0.5) * 40,
                        y + (Math.random() - 0.5) * 40,
                        color, 4
                    );
                });
            }, i * 300);
        }
    }

    // Shake an element
    function shake(element) {
        element.classList.remove('shake');
        void element.offsetWidth; // Force reflow
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 300);
    }

    // Flash an element green (correct) or red (wrong)
    function flash(element, color = 'green') {
        const colors = {
            green: 'rgba(34,197,94,0.3)',
            red: 'rgba(255,107,107,0.3)',
            yellow: 'rgba(226,183,20,0.3)'
        };
        const prev = element.style.boxShadow;
        element.style.boxShadow = `inset 0 0 30px ${colors[color] || colors.green}`;
        setTimeout(() => { element.style.boxShadow = prev; }, 400);
    }

    // Confetti rain for perfect score
    function confetti(duration = 2000) {
        const c = container();
        const colors = ['#e2b714', '#ff6b6b', '#4ecdc4', '#a855f7', '#22c55e', '#3b82f6'];
        const end = Date.now() + duration;

        function frame() {
            if (Date.now() > end) return;
            for (let i = 0; i < 3; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const color = colors[Math.floor(Math.random() * colors.length)];
                const x = Math.random() * window.innerWidth;
                const size = 4 + Math.random() * 6;
                p.style.cssText = `
                    left: ${x}px; top: -10px;
                    width: ${size}px; height: ${size}px;
                    background: ${color};
                    opacity: 1;
                `;
                // Animate falling
                const rot = Math.random() * 360;
                const drift = (Math.random() - 0.5) * 100;
                p.animate([
                    { transform: `translateY(0) translateX(0) rotate(0deg)`, opacity: 1 },
                    { transform: `translateY(${window.innerHeight + 20}px) translateX(${drift}px) rotate(${rot}deg)`, opacity: 0.5 }
                ], {
                    duration: 1500 + Math.random() * 1000,
                    easing: 'ease-in'
                }).onfinish = () => p.remove();
                c.appendChild(p);
            }
            requestAnimationFrame(frame);
        }
        frame();
    }

    return { pixelBurst, starBurst, fireworks, shake, flash, confetti };
})();
