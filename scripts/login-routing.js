export function getLoginDestination(user) {
  return user && user.role === 'owner' ? 'owner.html' : 'amazon.html';
}
