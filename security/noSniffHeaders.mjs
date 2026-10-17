// SE4030 SECURITY FIX - Z6
// Vulnerability: X-Content-Type-Options Header Missing
// Detection: OWASP ZAP
// Original: Vite did not set nosniff; individual static headers would also miss
// early errors/404s. Fix: set it before Vite handles any development/preview URL.
export function noSniffHeaders() {
    const install = server => {
        server.middlewares.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            next();
        });
    };
    return {
        name: 'se4030-nosniff-headers',
        enforce: 'pre',
        configureServer: install,
        configurePreviewServer: install,
    };
}
