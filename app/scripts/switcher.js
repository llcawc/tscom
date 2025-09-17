/**
 * @файл switcher.js
 * @описание скрипт работы переключателя цветовых тем
 * @действие вставляет атрибут 'data-bs-theme' в html элемент со значением 'light' или 'dark'
 */
function switcher() {
    // записать тему в локальное хранилище
    const setStoredTheme = (theme) => localStorage.setItem('color-mode', theme);
    // считать тему из локального хранилища
    const getStoredTheme = () => localStorage.getItem('color-mode');
    // определяем функцию удаления записи ключа с темой
    const removeStoredTheme = () => localStorage.removeItem('color-mode');
    // константа содержит ответ медиа запроса по наличию цветовой схемы дарк
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    // Получить текущую цветовую тему
    const getCurrentTheme = () => {
        const storedTheme = getStoredTheme();
        return storedTheme ? storedTheme : darkModeMediaQuery.matches ? 'dark' : 'light';
    };
    // Получить текущee представление системы
    const getPrefferedTheme = () => {
        const storedTheme = getStoredTheme() ?? 'auto';
        return storedTheme === 'auto' ? 'auto' : getCurrentTheme();
    };
    // Установить цветовую тему в атрибуте тега 'html'
    const setTheme = (theme) => {
        theme = theme === 'auto' ? (darkModeMediaQuery.matches ? 'dark' : 'light') : theme;
        return document.documentElement.setAttribute('data-bs-theme', theme);
    };
    // Отобразить переключение на пульте управления цветовыми темами
    const showActiveTheme = (theme, focus = false) => {
        const themeSwitcher = document.querySelector('#switcher-desktop');
        const btnToActive = document.querySelector(`[data-theme-value="${theme}"]`);
        const svgOfActive = btnToActive?.querySelector('svg use');
        const svgOfActiveBtn = svgOfActive?.getAttribute('href');
        const activeThemeIcon = document.querySelector('.theme-icon-active use');
        if (!themeSwitcher || !btnToActive || !svgOfActive || !svgOfActiveBtn || !activeThemeIcon) {
            return console.error(`Селектор не найден! `);
        }
        document.querySelectorAll('[data-theme-value]').forEach((element) => {
            element.classList.remove('active');
            element.setAttribute('aria-pressed', 'false');
        });
        btnToActive.classList.add('active');
        btnToActive.setAttribute('aria-pressed', 'true');
        activeThemeIcon.setAttribute('href', svgOfActiveBtn);
        const themeSwitcherLabel = `Color mode is ${btnToActive.dataset.themeValue}`;
        themeSwitcher.setAttribute('aria-label', themeSwitcherLabel);
        if (focus) {
            themeSwitcher.focus();
        }
    };
    // установка схемы при первом запуске
    showActiveTheme(getPrefferedTheme());
    setTheme(getCurrentTheme());
    // установка обработчика смены тем при ручном выборе
    document.querySelectorAll('[data-theme-value]').forEach((toggle) => {
        toggle.addEventListener('click', () => {
            let theme = toggle.getAttribute('data-theme-value');
            if (!theme) {
                theme = getPrefferedTheme();
            }
            showActiveTheme(theme, true);
            setTheme(theme);
            if (theme === 'auto') {
                removeStoredTheme();
            }
            else {
                setStoredTheme(theme);
            }
        });
    });
    // установка обработчика смены тем в системе
    darkModeMediaQuery.addEventListener('change', () => {
        const theme = getCurrentTheme();
        setTheme(theme);
    });
}
// установка скрипта после полной загрузки страницы
window.addEventListener('DOMContentLoaded', switcher);
// вариант экспорт функции switcher
// export { switcher as default }
