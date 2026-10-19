export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, decimals: 2, label: 'USD ($)' },
  ETB: { code: 'ETB', symbol: 'Br ', rate: 125.0, decimals: 2, label: 'ETB (Br)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, decimals: 2, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, decimals: 2, label: 'GBP (£)' }
};

export function getSelectedCurrency() {
  try {
    const saved = localStorage.getItem('topazion-currency');
    if (saved && CURRENCIES[saved]) return saved;
  } catch (e) {
    // Ignore localStorage access restrictions
  }
  return 'USD';
}

export function setSelectedCurrency(currencyCode) {
  if (CURRENCIES[currencyCode]) {
    try {
      localStorage.setItem('topazion-currency', currencyCode);
    } catch (e) {
      console.warn('Unable to save currency preference', e);
    }
    window.dispatchEvent(new CustomEvent('topazion:currency-change', {
      detail: { currency: currencyCode }
    }));
  }
}

export function formatcurrency(priceCents, currencyCode) {
  const code = currencyCode || getSelectedCurrency();
  const info = CURRENCIES[code] || CURRENCIES.USD;
  const numeric = (priceCents / 100) * info.rate;
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals
  });
}

export function formatPriceWithCurrency(priceCents, currencyCode) {
  const code = currencyCode || getSelectedCurrency();
  const info = CURRENCIES[code] || CURRENCIES.USD;
  return `${info.symbol}${formatcurrency(priceCents, code)}`;
}
