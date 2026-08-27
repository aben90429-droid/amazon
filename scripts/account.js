import { backendUrl } from '../data/backend.js';

export function setupAccountMenu() {
  const accountName = document.querySelector('.js-account-name');
  const signOutButton = document.querySelector('.sign-out-button');
  let user;
  try { user = JSON.parse(localStorage.getItem('topazionUser') || 'null'); } catch { user = null; }

  if (!accountName || !signOutButton) return;

  if (user) {
    accountName.textContent = user.displayName || user.username;
  } else {
    accountName.textContent = 'Sign in';
    accountName.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = 'login.html';
    });
  }

  signOutButton.addEventListener('click', async () => {
    const token = localStorage.getItem('topazionToken');
    try {
      if (token) {
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      localStorage.removeItem('topazionToken');
      localStorage.removeItem('topazionUser');
      localStorage.removeItem('cart');
      window.location.href = 'amazon.html';
    }
  });
}
