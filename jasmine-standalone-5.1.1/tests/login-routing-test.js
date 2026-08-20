import { getLoginDestination } from '../../scripts/login-routing.js';

describe('login destination', () => {
  it('sends the owner to the owner dashboard', () => {
    expect(getLoginDestination({ role: 'owner' })).toBe('owner.html');
  });

  it('sends a customer to the storefront', () => {
    expect(getLoginDestination({ role: 'customer' })).toBe('amazon.html');
  });

  it('sends any non-owner account to the storefront', () => {
    expect(getLoginDestination({ role: 'guest' })).toBe('amazon.html');
  });
});