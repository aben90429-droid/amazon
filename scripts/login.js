import { getLoginDestination } from './login-routing.js';
import { backendUrl } from '../data/backend.js';

const API_URL = backendUrl;
const loginForm = document.querySelector('#login-form');
const signupForm = document.querySelector('#signup-form');
const message = document.querySelector('#message');
const signInButton = document.querySelector('#sign-in-button');
const signUpButton = document.querySelector('#sign-up-button');
const toggleAuthModeButton = document.querySelector('#toggle-auth-mode');
const authTitle = document.querySelector('#auth-title');
const authIntro = document.querySelector('#auth-intro');
let isSignupMode = false;

function goToAccountPage(user) {
  window.location.assign(getLoginDestination(user));
}

function setMode(isSignup) {
  isSignupMode = Boolean(isSignup);
  loginForm.style.display = isSignupMode ? 'none' : 'grid';
  signupForm.style.display = isSignupMode ? 'grid' : 'none';
  loginForm.hidden = isSignupMode;
  signupForm.hidden = !isSignupMode;
  authTitle.textContent = isSignupMode ? 'Create account' : 'Sign in';
  authIntro.textContent = isSignupMode
    ? 'Set up a shopper account in seconds.'
    : 'Use your name and password to open your own cart.';
  toggleAuthModeButton.textContent = isSignupMode ? 'Already have an account? Sign in' : 'Create an account';
  message.textContent = '';
}

async function authenticate(endpoint, payload, button, idleText) {
  button.disabled = true;
  button.textContent = 'Please wait...';
  message.textContent = '';

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Request failed.');

    localStorage.setItem('topazionToken', result.token);
    localStorage.setItem('topazionUser', JSON.stringify(result.user));

    try {
      const cartResponse = await fetch(`${API_URL}/me/cart`, {
        headers: { Authorization: `Bearer ${result.token}` }
      });
      const serverCart = await cartResponse.json();
      if (!cartResponse.ok) throw new Error(serverCart.error || 'Could not load your cart.');
      localStorage.setItem('cart', JSON.stringify(serverCart.items));
    } catch (cartError) {
      console.error('Could not restore the saved cart.', cartError);
      localStorage.setItem('cart', JSON.stringify([]));
    }

    goToAccountPage(result.user);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = idleText;
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  await authenticate('/auth/login', {
    username: formData.get('username'),
    password: formData.get('password')
  }, signInButton, 'Sign in');
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  await authenticate('/auth/signup', {
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    password: formData.get('password')
  }, signUpButton, 'Create account');
});

toggleAuthModeButton.addEventListener('click', () => {
  setMode(!isSignupMode);
});

setMode(false);
