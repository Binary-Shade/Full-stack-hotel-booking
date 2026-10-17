import { createHash } from 'node:crypto';

// SE4030 SECURITY FIX - Z2
// Vulnerability: Content Security Policy (CSP) Header Not Set
// Detection: OWASP ZAP
// Original: neither Vite app configured a CSP response header.
// Fix: restrict executable resources while allowing the existing integrations.
export function frontendCsp({ application, development = false, reactPreamble = '' }) {
    const client = application === 'client';
    const scripts = ["'self'"];
    if (development) {
        // Authorize only the installed React plugin's exact refresh preamble.
        // Both apps use Vite's default base '/'; no unsafe-inline/eval scripts.
        if (!reactPreamble) throw new Error('React refresh preamble is required for development CSP');
        const hash = createHash('sha256')
            .update(reactPreamble.replace('__BASE__', '/'))
            .digest('base64');
        scripts.push(`'sha256-${hash}'`);
    }
    if (client) scripts.push('https://accounts.google.com/gsi/client');

    const connections = ["'self'", 'http://localhost:8001', 'http://127.0.0.1:8001'];
    if (development) {
        // Local Vite HMR may select a free port; preview has no WebSocket allowance.
        connections.push('ws://localhost:*', 'ws://127.0.0.1:*');
    }
    connections.push(...(client
        ? ['https://accounts.google.com/gsi/']
        : ['https://firebasestorage.googleapis.com', 'https://api.cloudinary.com']));

    const directives = {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'object-src': ["'none'"],
        'script-src': scripts,
        'script-src-attr': ["'none'"],
        // React style props, MUI/Emotion and Vite's CSS injection require inline
        // styles. This exception does not permit inline JavaScript execution.
        // SE4030 SECURITY FIX - Z5: Poppins now loads from reviewed local assets;
        // Google Fonts stylesheet/font origins are no longer required.
        'style-src': ["'self'", "'unsafe-inline'",
            ...(client ? ['https://accounts.google.com/gsi/style'] : [])],
        'font-src': ["'self'"],
        // Hotel/user image URLs come from stored data as well as static assets.
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': connections,
        'frame-src': client ? ['https://accounts.google.com/gsi/'] : ["'none'"],
        // Explicit directives avoid introducing Z1 and also contribute to Z4.
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
    };
    return Object.entries(directives)
        .map(([directive, values]) => `${directive} ${values.join(' ')}`)
        .join('; ');
}
