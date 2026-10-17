const localBackendUrl = 'http://localhost:8000';

function getBackendUrl() {
    const { hostname, protocol, origin } = window.location;
    if (hostname.endsWith('.devtunnels.ms')) {
        return `${protocol}//${hostname.replace('-5173.', '-8000.')}`;
    }
    if (protocol === 'http:' || protocol === 'https:') {
        return origin;
    }
    return localBackendUrl;
}

export const backendUrl = getBackendUrl();

export function notifyError(error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    window.dispatchEvent(new CustomEvent('topazion:error', { detail: message }));
    window.alert(`Topazion error: ${message}`);
}
