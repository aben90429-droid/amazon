import { cart, loadFromStorage, setQuantity } from '../../data/cart.js';

describe('cart edge cases', () => {
  it('clears malformed stored cart data', () => {
    spyOn(localStorage, 'getItem').and.returnValue('{bad json');
    spyOn(localStorage, 'removeItem');

    loadFromStorage();

    expect(cart).toEqual([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith('cart');
  });

  it('removes an item when its quantity is set below one', () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([
      { productId: 'product-1', quantity: 2 }
    ]));
    spyOn(localStorage, 'setItem');

    loadFromStorage();
    setQuantity('product-1', 0);

    expect(cart).toEqual([]);
    expect(localStorage.setItem).toHaveBeenCalledWith('cart', '[]');
  });
});
