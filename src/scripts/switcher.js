/**
 * @файл switcher.js
 * @описание скрипт работы переключателя цветовых тем
 * @действие вставляет атрибут 'data-bs-theme' в html элемент со значением 'light' или 'dark'
 */
export default function switcher() {
    // записать тему в локальное хранилище
    const setStoredTheme = (theme) => localStorage.setItem('color-mode', theme);
    // считать тему из локального хранилища
    const getStoredTheme = () => localStorage.getItem('color-mode');
    // определяем функцию удаления записи ключа с темой
    const removeStoredTheme = () => localStorage.removeItem('color-mode');
    // константа содержит ответ медиа запроса по наличию цветовой схемы дарк
    const list = window.matchMedia('(prefers-color-scheme: dark)');
    // Получить текущую цветовую тему
    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme();
        return storedTheme ? storedTheme : list.matches ? 'dark' : 'light';
    };
    // взять корень документа один раз
    const html = document.documentElement;
    // Установить цветовую тему в атрибуте тега 'html'
    const setTheme = (theme) => {
        return html.setAttribute('data-bs-theme', theme === 'auto' ? (list.matches ? 'dark' : 'light') : theme);
    };
    // Отобразить переключение на пульте управления цветовыми темами
    const showActiveTheme = (theme, focus = false) => {
        const themeSwitcher = document.querySelector('#switcher-desktop');
        if (!themeSwitcher) {
            console.error(`Селектор "#switcher-desktop" не найден! `);
            return;
        }
        const btnToActive = document.querySelector(`[data-theme-value="${theme}"]`);
        if (!btnToActive) {
            console.error(`Селектор "[data-theme-value="${theme}"]" не найден! `);
            return;
        }
        const svgOfActive = btnToActive.querySelector('svg use');
        if (!svgOfActive) {
            console.error(`Селектор "svg use" не найден! `);
            return;
        }
        const svgOfActiveBtn = svgOfActive.getAttribute('href');
        if (!svgOfActiveBtn) {
            console.error(`Селектор "svg use" не найден! `);
            return;
        }
        const activeThemeIcon = document.querySelector('.theme-icon-active use');
        if (!activeThemeIcon) {
            console.error(`Селектор ".theme-icon-active use" не найден! `);
            return;
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
    setTheme(getPreferredTheme());
    showActiveTheme(getPreferredTheme());
    // установка обработчика смены тем при ручном выборе
    document.querySelectorAll('[data-theme-value]').forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const theme = toggle.getAttribute('data-theme-value') ?? 'auto';
            setStoredTheme(theme);
            setTheme(theme);
            showActiveTheme(theme, true);
        });
    });
    // установка обработчика смены тем в системе
    list.addEventListener('change', () => {
        removeStoredTheme();
        const theme = getPreferredTheme();
        setTheme(theme);
        showActiveTheme(theme, true);
    });
}
// установка скрипта после полной загрузки страницы
window.addEventListener('DOMContentLoaded', switcher);
