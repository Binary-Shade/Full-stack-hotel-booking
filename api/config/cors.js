// SE4030 SECURITY FIX - Z3
// Vulnerability: Cross-Domain Misconfiguration
// Detection: OWASP ZAP (original wildcard finding was on Vite, not the API).
// Fix: authorize only the actual client/admin origins for credentialed API use.
export function apiCorsOptions(env = process.env) {
    const production = env.NODE_ENV === 'production';
    const configured = [
        ['CLIENT_URL', env.CLIENT_URL ?? (production ? undefined : 'http://localhost:5173')],
        ['ADMIN_URL', env.ADMIN_URL ?? (production ? undefined : 'http://localhost:5174')],
    ];
    const allowedOrigins = new Set(configured.map(([name, value]) => {
        // Origin values contain a scheme, host and optional port, never a path,
        // wildcard, credentials, query or fragment. Do not log invalid values.
        let parsed;
        try { parsed = new URL(value); } catch {
            throw new Error(`${name} must be set to a valid HTTP(S) origin`);
        }
        if (!['http:', 'https:'].includes(parsed.protocol)
            || parsed.hostname.includes('*') || parsed.username || parsed.password
            || value !== parsed.origin) {
            throw new Error(`${name} must be an exact HTTP(S) origin without a path`);
        }
        return value;
    }));

    return {
        origin(origin, callback) {
            // Rejected/no-Origin requests receive no CORS permission. They still
            // pass through normal authentication; CORS is not access control.
            callback(null, typeof origin === 'string' && allowedOrigins.has(origin));
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type'],
        maxAge: 600,
    };
}
