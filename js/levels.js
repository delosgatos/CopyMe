/* ============================================
   Levels — 20 уровней для MVP
   4 пака × 5 уровней, сетка 8×8
   ============================================ */

const Levels = (() => {
    // Color palettes per pack
    const PALETTES = {
        animals: ['#000000', '#ffffff', '#f39c12', '#e74c3c', '#8B4513', '#2ecc71', '#3498db', '#ff69b4'],
        space:   ['#000000', '#ffffff', '#1a1a2e', '#e2b714', '#ff6b6b', '#3b82f6', '#a855f7', '#4ecdc4'],
        food:    ['#000000', '#ffffff', '#e74c3c', '#f39c12', '#2ecc71', '#ff69b4', '#8B4513', '#ffd93d'],
        culture: ['#000000', '#ffffff', '#e74c3c', '#e2b714', '#3498db', '#2ecc71', '#8B4513', '#ff6b6b'],
    };

    // _ = 0(black), W = 1(white), O = 2(orange/varies), R = 3(red/varies), etc.
    // Index into the pack's palette

    const data = [
        // ===== PACK: ANIMALS =====
        {
            id: 'animals_01', pack: 'animals', difficulty: 1,
            name: { ru: 'Котёнок', en: 'Kitten' },
            size: 8,
            grid: [
                [0,0,1,1,1,1,0,0],
                [0,1,2,1,1,2,1,0],
                [0,1,1,1,1,1,1,0],
                [1,1,0,1,1,0,1,1],
                [1,1,1,3,3,1,1,1],
                [0,1,1,1,1,1,1,0],
                [0,0,1,0,0,1,0,0],
                [0,0,0,0,0,0,0,0],
            ]
        },
        {
            id: 'animals_02', pack: 'animals', difficulty: 1,
            name: { ru: 'Рыбка', en: 'Fish' },
            size: 8,
            grid: [
                [0,0,0,0,0,0,0,0],
                [0,0,0,6,6,0,0,0],
                [0,0,6,2,2,6,0,0],
                [6,6,2,2,0,2,6,0],
                [6,6,2,2,2,2,6,0],
                [0,0,6,2,2,6,0,0],
                [0,0,0,6,6,0,0,0],
                [0,0,0,0,0,0,0,0],
            ]
        },
        {
            id: 'animals_03', pack: 'animals', difficulty: 1,
            name: { ru: 'Зайка', en: 'Bunny' },
            size: 8,
            grid: [
                [0,0,1,0,0,1,0,0],
                [0,0,1,0,0,1,0,0],
                [0,1,7,1,1,7,1,0],
                [0,1,1,1,1,1,1,0],
                [0,1,0,1,1,0,1,0],
                [0,1,1,3,3,1,1,0],
                [0,0,1,1,1,1,0,0],
                [0,0,0,1,1,0,0,0],
            ]
        },
        {
            id: 'animals_04', pack: 'animals', difficulty: 2,
            name: { ru: 'Собачка', en: 'Puppy' },
            size: 8,
            grid: [
                [0,4,0,0,0,0,4,0],
                [4,4,1,1,1,1,4,4],
                [0,1,0,1,1,0,1,0],
                [0,1,1,1,1,1,1,0],
                [0,0,1,0,0,1,0,0],
                [0,1,4,1,1,4,1,0],
                [0,0,1,1,1,1,0,0],
                [0,0,0,1,1,0,0,0],
            ]
        },
        {
            id: 'animals_05', pack: 'animals', difficulty: 2,
            name: { ru: 'Лягушка', en: 'Frog' },
            size: 8,
            grid: [
                [0,5,5,0,0,5,5,0],
                [5,1,0,5,5,0,1,5],
                [5,5,5,5,5,5,5,5],
                [5,5,5,5,5,5,5,5],
                [5,3,3,3,3,3,3,5],
                [0,5,5,5,5,5,5,0],
                [0,0,5,0,0,5,0,0],
                [0,0,0,0,0,0,0,0],
            ]
        },

        // ===== PACK: SPACE =====
        {
            id: 'space_01', pack: 'space', difficulty: 1,
            name: { ru: 'Ракета', en: 'Rocket' },
            size: 8,
            grid: [
                [0,0,0,4,4,0,0,0],
                [0,0,4,1,1,4,0,0],
                [0,0,1,1,1,1,0,0],
                [0,0,1,5,5,1,0,0],
                [0,0,1,1,1,1,0,0],
                [0,4,1,1,1,1,4,0],
                [4,0,0,3,3,0,0,4],
                [0,0,0,4,4,0,0,0],
            ]
        },
        {
            id: 'space_02', pack: 'space', difficulty: 1,
            name: { ru: 'Звезда', en: 'Star' },
            size: 8,
            grid: [
                [0,0,0,3,3,0,0,0],
                [0,0,3,3,3,3,0,0],
                [3,3,3,3,3,3,3,3],
                [0,3,3,3,3,3,3,0],
                [0,0,3,3,3,3,0,0],
                [0,3,3,0,0,3,3,0],
                [3,3,0,0,0,0,3,3],
                [3,0,0,0,0,0,0,3],
            ]
        },
        {
            id: 'space_03', pack: 'space', difficulty: 2,
            name: { ru: 'Планета', en: 'Planet' },
            size: 8,
            grid: [
                [0,0,5,5,5,5,0,0],
                [0,5,7,5,5,7,5,0],
                [5,5,5,5,7,5,5,5],
                [5,7,5,5,5,5,7,5],
                [5,5,5,7,5,5,5,5],
                [5,5,7,5,5,7,5,5],
                [0,5,5,5,5,5,5,0],
                [0,0,5,5,5,5,0,0],
            ]
        },
        {
            id: 'space_04', pack: 'space', difficulty: 2,
            name: { ru: 'НЛО', en: 'UFO' },
            size: 8,
            grid: [
                [0,0,0,7,7,0,0,0],
                [0,0,7,6,6,7,0,0],
                [0,7,6,1,1,6,7,0],
                [7,6,6,6,6,6,6,7],
                [6,1,6,1,6,1,6,1],
                [0,7,7,7,7,7,7,0],
                [0,0,3,0,0,3,0,0],
                [0,0,0,0,0,0,0,0],
            ]
        },
        {
            id: 'space_05', pack: 'space', difficulty: 2,
            name: { ru: 'Космонавт', en: 'Astronaut' },
            size: 8,
            grid: [
                [0,0,1,1,1,1,0,0],
                [0,1,5,5,5,5,1,0],
                [0,1,5,0,0,5,1,0],
                [0,0,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,0],
                [1,5,1,1,1,1,5,1],
                [0,0,1,0,0,1,0,0],
                [0,0,1,0,0,1,0,0],
            ]
        },

        // ===== PACK: FOOD =====
        {
            id: 'food_01', pack: 'food', difficulty: 1,
            name: { ru: 'Арбуз', en: 'Watermelon' },
            size: 8,
            grid: [
                [0,0,4,4,4,4,0,0],
                [0,4,2,2,2,2,4,0],
                [4,2,0,2,2,0,2,4],
                [4,2,2,2,2,2,2,4],
                [4,2,2,0,0,2,2,4],
                [4,2,2,2,2,2,2,4],
                [0,4,2,2,2,2,4,0],
                [0,0,4,4,4,4,0,0],
            ]
        },
        {
            id: 'food_02', pack: 'food', difficulty: 1,
            name: { ru: 'Мороженое', en: 'Ice Cream' },
            size: 8,
            grid: [
                [0,0,5,5,5,5,0,0],
                [0,5,5,1,1,5,5,0],
                [0,5,1,5,5,1,5,0],
                [0,5,5,5,5,5,5,0],
                [0,0,3,3,3,3,0,0],
                [0,0,0,3,3,0,0,0],
                [0,0,0,3,3,0,0,0],
                [0,0,0,0,0,0,0,0],
            ]
        },
        {
            id: 'food_03', pack: 'food', difficulty: 1,
            name: { ru: 'Пицца', en: 'Pizza' },
            size: 8,
            grid: [
                [0,0,0,7,0,0,0,0],
                [0,0,7,3,7,0,0,0],
                [0,7,3,2,3,7,0,0],
                [0,7,2,3,2,3,7,0],
                [7,3,3,2,3,3,3,7],
                [7,3,2,3,3,2,3,7],
                [7,7,7,7,7,7,7,7],
                [0,0,0,0,0,0,0,0],
            ]
        },
        {
            id: 'food_04', pack: 'food', difficulty: 2,
            name: { ru: 'Кекс', en: 'Cupcake' },
            size: 8,
            grid: [
                [0,0,0,2,0,0,0,0],
                [0,0,5,5,5,0,0,0],
                [0,5,7,5,7,5,0,0],
                [0,5,5,5,5,5,0,0],
                [0,0,6,6,6,0,0,0],
                [0,6,6,6,6,6,0,0],
                [0,6,6,6,6,6,0,0],
                [0,0,6,6,6,0,0,0],
            ]
        },
        {
            id: 'food_05', pack: 'food', difficulty: 2,
            name: { ru: 'Яблоко', en: 'Apple' },
            size: 8,
            grid: [
                [0,0,0,4,0,0,0,0],
                [0,0,4,4,0,0,0,0],
                [0,2,2,2,2,2,0,0],
                [2,2,1,2,2,2,2,0],
                [2,2,2,2,2,2,2,0],
                [2,2,2,2,2,2,2,0],
                [0,2,2,2,2,2,0,0],
                [0,0,2,2,2,0,0,0],
            ]
        },

        // ===== PACK: CULTURE =====
        {
            id: 'culture_01', pack: 'culture', difficulty: 1,
            name: { ru: 'Матрёшка', en: 'Matryoshka' },
            size: 8,
            grid: [
                [0,0,3,3,3,3,0,0],
                [0,3,4,4,4,4,3,0],
                [0,3,1,1,1,1,3,0],
                [0,3,1,0,0,1,3,0],
                [0,3,3,3,3,3,3,0],
                [3,3,2,3,3,2,3,3],
                [3,3,3,3,3,3,3,3],
                [0,3,3,3,3,3,3,0],
            ]
        },
        {
            id: 'culture_02', pack: 'culture', difficulty: 1,
            name: { ru: 'Самовар', en: 'Samovar' },
            size: 8,
            grid: [
                [0,0,0,3,3,0,0,0],
                [0,0,3,4,4,3,0,0],
                [0,3,4,4,4,4,3,0],
                [3,3,4,4,4,4,3,3],
                [0,3,4,4,4,4,3,0],
                [0,0,3,4,4,3,0,0],
                [0,3,3,3,3,3,3,0],
                [0,3,3,3,3,3,3,0],
            ]
        },
        {
            id: 'culture_03', pack: 'culture', difficulty: 2,
            name: { ru: 'Кремль', en: 'Kremlin' },
            size: 8,
            grid: [
                [0,0,0,3,3,0,0,0],
                [0,0,3,4,4,3,0,0],
                [0,0,3,1,1,3,0,0],
                [0,3,3,1,1,3,3,0],
                [3,3,1,1,1,1,3,3],
                [3,1,1,0,0,1,1,3],
                [3,1,1,0,0,1,1,3],
                [3,3,3,3,3,3,3,3],
            ]
        },
        {
            id: 'culture_04', pack: 'culture', difficulty: 2,
            name: { ru: 'Балалайка', en: 'Balalaika' },
            size: 8,
            grid: [
                [0,0,0,0,0,6,0,0],
                [0,0,0,0,6,0,0,0],
                [0,0,0,6,0,0,0,0],
                [0,0,6,6,0,0,0,0],
                [0,6,4,6,0,0,0,0],
                [6,4,0,4,6,0,0,0],
                [0,6,4,6,0,0,0,0],
                [0,0,6,0,0,0,0,0],
            ]
        },
        {
            id: 'culture_05', pack: 'culture', difficulty: 2,
            name: { ru: 'Храм', en: 'Temple' },
            size: 8,
            grid: [
                [0,0,0,3,3,0,0,0],
                [0,0,3,4,4,3,0,0],
                [0,0,0,1,1,0,0,0],
                [0,0,1,1,1,1,0,0],
                [0,1,1,1,1,1,1,0],
                [0,1,1,0,0,1,1,0],
                [0,1,1,0,0,1,1,0],
                [1,1,1,1,1,1,1,1],
            ]
        },
    ];

    // Packs metadata
    const packs = [
        { id: 'animals', icon: '🐾', name: { ru: 'Животные', en: 'Animals' } },
        { id: 'space',   icon: '🚀', name: { ru: 'Космос',   en: 'Space' } },
        { id: 'food',    icon: '🍕', name: { ru: 'Еда',      en: 'Food' } },
        { id: 'culture', icon: '🏛', name: { ru: 'Культура',  en: 'Culture' } },
    ];

    function getAll() { return data; }
    function getPacks() { return packs; }
    function getPalette(packId) { return PALETTES[packId] || PALETTES.animals; }

    function getByPack(packId) {
        return data.filter(l => l.pack === packId);
    }

    function getById(id) {
        return data.find(l => l.id === id);
    }

    function getNextLevel(currentId) {
        const idx = data.findIndex(l => l.id === currentId);
        return idx >= 0 && idx < data.length - 1 ? data[idx + 1] : null;
    }

    function isUnlocked(levelId) {
        const idx = data.findIndex(l => l.id === levelId);
        if (idx === 0) return true; // First level always unlocked
        // Unlock if previous level is completed
        const prev = data[idx - 1];
        if (!prev) return true;
        return Storage.getLevelProgress(prev.id).completed;
    }

    return { getAll, getPacks, getPalette, getByPack, getById, getNextLevel, isUnlocked };
})();
