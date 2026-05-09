/* ============================================
   CatSkins — Unlockable character appearances
   Tied to XP level progression
   ============================================ */

const CatSkins = (() => {
    // Skins unlocked at each XP level index
    const SKINS = [
        {
            id: 'kitten',
            name: { ru: 'Котёнок', en: 'Kitten' },
            levelReq: 0,
            body: '#f39c12',
            ear: '#f39c12',
            earInner: '#e67e22',
            eye: '#fff',
            pupil: '#000',
            whiskerColor: '#000',
            trailColor: 'rgba(243, 156, 18, ALPHA)',
        },
        {
            id: 'ginger',
            name: { ru: 'Рыжик', en: 'Ginger' },
            levelReq: 1,
            body: '#e67e22',
            ear: '#e67e22',
            earInner: '#d35400',
            eye: '#fff',
            pupil: '#2c3e50',
            whiskerColor: '#2c3e50',
            trailColor: 'rgba(230, 126, 34, ALPHA)',
        },
        {
            id: 'shadow',
            name: { ru: 'Тень', en: 'Shadow' },
            levelReq: 2,
            body: '#2c3e50',
            ear: '#2c3e50',
            earInner: '#1a252f',
            eye: '#2ecc71',
            pupil: '#000',
            whiskerColor: '#7f8c8d',
            trailColor: 'rgba(44, 62, 80, ALPHA)',
        },
        {
            id: 'tiger',
            name: { ru: 'Тигр', en: 'Tiger' },
            levelReq: 3,
            body: '#e67e22',
            ear: '#e67e22',
            earInner: '#c0392b',
            eye: '#fff',
            pupil: '#000',
            whiskerColor: '#000',
            trailColor: 'rgba(230, 126, 34, ALPHA)',
            stripes: true,
            stripeColor: '#2c3e50',
        },
        {
            id: 'arctic',
            name: { ru: 'Снежный', en: 'Arctic' },
            levelReq: 4,
            body: '#ecf0f1',
            ear: '#ecf0f1',
            earInner: '#bdc3c7',
            eye: '#3498db',
            pupil: '#1a252f',
            whiskerColor: '#95a5a6',
            trailColor: 'rgba(236, 240, 241, ALPHA)',
        },
        {
            id: 'dragon',
            name: { ru: 'Дракон', en: 'Dragon' },
            levelReq: 5,
            body: '#8e44ad',
            ear: '#8e44ad',
            earInner: '#6c3483',
            eye: '#f1c40f',
            pupil: '#c0392b',
            whiskerColor: '#f1c40f',
            trailColor: 'rgba(142, 68, 173, ALPHA)',
            glow: '#a855f7',
        },
        {
            id: 'legend',
            name: { ru: 'Легенда', en: 'Legend' },
            levelReq: 6,
            body: '#f1c40f',
            ear: '#f1c40f',
            earInner: '#f39c12',
            eye: '#fff',
            pupil: '#e74c3c',
            whiskerColor: '#e74c3c',
            trailColor: 'rgba(241, 196, 15, ALPHA)',
            glow: '#f1c40f',
            crown: true,
        },
    ];

    function getUnlockedSkins() {
        const lvl = XPSystem.getCurrentLevel();
        return SKINS.filter(s => s.levelReq <= lvl.index);
    }

    function getActiveSkin() {
        const savedId = Storage.get('active_skin', 'kitten');
        const unlocked = getUnlockedSkins();
        const skin = unlocked.find(s => s.id === savedId);
        return skin || SKINS[0];
    }

    function setActiveSkin(skinId) {
        const unlocked = getUnlockedSkins();
        if (unlocked.find(s => s.id === skinId)) {
            Storage.set('active_skin', skinId);
        }
    }

    function getAllSkins() {
        return SKINS;
    }

    return { getUnlockedSkins, getActiveSkin, setActiveSkin, getAllSkins };
})();
