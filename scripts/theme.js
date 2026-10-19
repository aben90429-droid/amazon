(() => {
  const storageKey = 'topazion-theme';
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem(storageKey);
  let theme = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : (colorScheme.matches ? 'dark' : 'light');

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = theme === 'dark' ? '#0c1815' : '#142e2a';
    }

    const toggles = document.querySelectorAll('.theme-toggle, .js-theme-toggle');
    toggles.forEach((toggle) => {
      const isDark = theme === 'dark';
      toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      toggle.setAttribute('aria-pressed', String(isDark));
      toggle.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
      const icon = toggle.querySelector('.theme-toggle-icon');
      if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
      }
      const label = toggle.querySelector('.theme-toggle-label');
      if (label) {
        label.textContent = isDark ? 'Light' : 'Dark';
      }
    });

    window.dispatchEvent(new CustomEvent('topazion:theme-change', { detail: { theme } }));
  }

  // Immediately apply theme attribute to avoid flash of wrong theme
  document.documentElement.dataset.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }
    applyTheme();
  }

  window.toggleTopazionTheme = toggleTheme;
  window.getTopazionTheme = () => theme;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle, .js-theme-toggle').forEach((btn) => {
      btn.removeEventListener('click', toggleTheme);
      btn.addEventListener('click', toggleTheme);
    });

    if (!document.querySelector('.theme-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.type = 'button';
      toggle.innerHTML = '<span class="theme-toggle-icon" aria-hidden="true"></span><span class="theme-toggle-label"></span>';
      toggle.addEventListener('click', toggleTheme);
      document.body.append(toggle);
    }

    applyTheme();
  });

  colorScheme.addEventListener('change', (event) => {
    if (localStorage.getItem(storageKey) === null) {
      theme = event.matches ? 'dark' : 'light';
      applyTheme();
    }
  });
})();
