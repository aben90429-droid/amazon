export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

export function safeImagePath(value) {
  const imagePath = String(value ?? '');
  return imagePath.startsWith('images/') && !imagePath.includes('..') ? imagePath : '';
}