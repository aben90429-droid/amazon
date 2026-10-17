(() => {
  const storageKey = 'topazion-theme';
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem(storageKey);
  let theme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : colorScheme.matches ? 'dark' : 'light';

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = theme === 'dark' ? '#101d1a' : '#17302d';
    }

    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      const isDark = theme === 'dark';
      toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
      toggle.querySelector('.theme-toggle-icon').textContent = isDark ? '☀' : '☾';
      toggle.querySelector('.theme-toggle-label').textContent = isDark ? 'Light' : 'Dark';
    }
  }

  document.documentElement.dataset.theme = theme;

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.type = 'button';
    toggle.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span><span class="theme-toggle-label"></span>';
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(storageKey, theme);
      applyTheme();
    });
    document.body.append(toggle);
    applyTheme();
  });

  colorScheme.addEventListener('change', (event) => {
    if (localStorage.getItem(storageKey) === null) {
      theme = event.matches ? 'dark' : 'light';
      applyTheme();
    }
  });
})();
