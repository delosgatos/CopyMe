/* ============================================
   i18n — Мультиязычность (RU / EN)
   ============================================ */

const I18n = (() => {
    let currentLang = 'ru';

    const translations = {
        ru: {
            'splash.subtitle': 'Скопируй рисунок!',
            'splash.play': '▶ ИГРАТЬ',
            'levels.title': 'Уровни',
            'game.original': 'ОРИГИНАЛ',
            'game.canvas': 'ХОЛСТ',
            'game.check': '✓ Готово!',
            'result.retry': '🔄 Ещё раз',
            'result.next': '▶ Далее',
            'result.perfect': 'ИДЕАЛЬНО!',
            'result.great': 'ОТЛИЧНО!',
            'result.good': 'ХОРОШО!',
            'result.try_again': 'ПОПРОБУЙ ЕЩЁ!',
            'result.accuracy': 'Точность',
            'result.time': 'Время',
            'result.hints': 'Подсказки',
            'pack.animals': '🐾 Животные',
            'pack.space': '🚀 Космос',
            'pack.food': '🍕 Еда',
            'pack.culture': '🏛 Культура',
            'tool.pencil': 'Карандаш',
            'tool.fill': 'Заливка',
            'tool.eraser': 'Ластик',
            'tool.eyedropper': 'Пипетка',
            'tool.undo': 'Отмена',
            'tool.hint': 'Подсказка',
            'modes.choose': 'Выбери режим:',
            'game.memorize': 'Запоминай!',
            'result.mode': 'Режим',
            'result.times_up': 'ВРЕМЯ ВЫШЛО!',
        },
        en: {
            'splash.subtitle': 'Copy the picture!',
            'splash.play': '▶ PLAY',
            'levels.title': 'Levels',
            'game.original': 'ORIGINAL',
            'game.canvas': 'CANVAS',
            'game.check': '✓ Done!',
            'result.retry': '🔄 Retry',
            'result.next': '▶ Next',
            'result.perfect': 'PERFECT!',
            'result.great': 'GREAT!',
            'result.good': 'GOOD!',
            'result.try_again': 'TRY AGAIN!',
            'result.accuracy': 'Accuracy',
            'result.time': 'Time',
            'result.hints': 'Hints',
            'pack.animals': '🐾 Animals',
            'pack.space': '🚀 Space',
            'pack.food': '🍕 Food',
            'pack.culture': '🏛 Culture',
            'tool.pencil': 'Pencil',
            'tool.fill': 'Fill',
            'tool.eraser': 'Eraser',
            'tool.eyedropper': 'Eyedropper',
            'tool.undo': 'Undo',
            'tool.hint': 'Hint',
            'modes.choose': 'Choose mode:',
            'game.memorize': 'Memorize!',
            'result.mode': 'Mode',
            'result.times_up': "TIME'S UP!",
        }
    };

    function t(key) {
        return (translations[currentLang] && translations[currentLang][key])
            || (translations['ru'] && translations['ru'][key])
            || key;
    }

    function setLang(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        applyAll();
        Storage.set('lang', lang);
    }

    function getLang() {
        return currentLang;
    }

    function applyAll() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }

    function init() {
        const saved = Storage.get('lang');
        if (saved && translations[saved]) {
            currentLang = saved;
        }
        applyAll();
    }

    return { t, setLang, getLang, init, applyAll };
})();
