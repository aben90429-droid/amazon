const API_URL = 'http://localhost:8000';
const form = document.querySelector('#login-form');
const message = document.querySelector('#message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  const formData = new FormData(form);
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Sign in failed.');
    localStorage.setItem('topazionToken', payload.token);
    localStorage.setItem('topazionUser', JSON.stringify(payload.user));
    const cartResponse = await fetch(`${API_URL}/me/cart`, {
      headers: { Authorization: `Bearer ${payload.token}` }
    });
    const serverCart = await cartResponse.json();
    if (!cartResponse.ok) throw new Error(serverCart.error || 'Could not load your cart.');
    if (serverCart.items.length === 0) {
      localStorage.setItem('cart', JSON.stringify([]));
    } else {
      localStorage.setItem('cart', JSON.stringify(serverCart.items));
    }
    window.location.href = payload.user.role === 'owner' ? 'people.html' : 'amazon.html';
  } catch (error) {
    message.textContent = error.message;
  }
});
