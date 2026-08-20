export const backendUrl = 'http://localhost:8000';

export function notifyError(error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    window.dispatchEvent(new CustomEvent('topazion:error', { detail: message }));
    window.alert(`Topazion error: ${message}`);
}
