import { getSelectedCurrency, setSelectedCurrency, CURRENCIES } from './uitils/money.js';

export function setupHeader() {
  // 1. Mobile Menu Drawer Setup
  const mobileToggleButtons = document.querySelectorAll('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const backdrop = document.querySelector('.mobile-nav-backdrop');
  const drawerCloseBtn = document.querySelector('.mobile-nav-close');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-open');
    document.body.classList.add('drawer-open');
    mobileToggleButtons.forEach((btn) => btn.setAttribute('aria-expanded', 'true'));
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    mobileToggleButtons.forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  }

  mobileToggleButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer && drawer.classList.contains('is-open');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  });

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }

  // Close drawer when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Close drawer when clicking any link inside it
  if (drawer) {
    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });
  }

  // 2. Currency Selectors (sync utility bar & mobile drawer)
  const currencySelects = document.querySelectorAll('.js-currency-select');
  const currentCurrency = getSelectedCurrency();

  currencySelects.forEach((select) => {
    select.value = currentCurrency;
    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      setSelectedCurrency(selected);
      // Sync all select elements
      currencySelects.forEach((s) => {
        if (s !== e.target) s.value = selected;
      });
    });
  });

  window.addEventListener('topazion:currency-change', (e) => {
    const cur = e.detail?.currency;
    if (cur) {
      currencySelects.forEach((select) => {
        select.value = cur;
      });
    }
  });

  // 3. Language Selectors (sync utility bar & mobile drawer)
  const languageSelects = document.querySelectorAll('.js-language-select');
  const savedLang = (() => {
    try {
      return localStorage.getItem('topazion-lang') || 'en';
    } catch {
      return 'en';
    }
  })();

  languageSelects.forEach((select) => {
    select.value = savedLang;
    select.addEventListener('change', (e) => {
      const selected = e.target.value;
      try {
        localStorage.setItem('topazion-lang', selected);
      } catch (err) {
        console.warn('Unable to persist language preference', err);
      }
      languageSelects.forEach((s) => {
        if (s !== e.target) s.value = selected;
      });
      window.dispatchEvent(new CustomEvent('topazion:lang-change', {
        detail: { language: selected }
      }));
    });
  });
}

// Auto-run when imported or when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupHeader);
} else {
  setupHeader();
}
