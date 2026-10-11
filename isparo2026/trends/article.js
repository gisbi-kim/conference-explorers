'use strict';
const themeButton = document.getElementById('theme');
function syncThemeButton() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  themeButton.textContent = isDark ? '라이트 모드' : '다크 모드';
  themeButton.setAttribute('aria-label', isDark ? '라이트 모드' : '다크 모드');
  themeButton.setAttribute('aria-pressed', String(isDark));
}
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('isparo2026-theme', theme); } catch {}
  syncThemeButton();
});
syncThemeButton();
document.getElementById('print').addEventListener('click', () => window.print());
