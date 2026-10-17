import assert from 'node:assert/strict';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from '../../api/node_modules/express/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.argv.includes('--before');
const preview = process.argv.includes('--preview');
const origins = ['http://localhost:5173', 'http://localhost:5174', 'https://untrusted.example', 'http://localhost:5173.untrusted.example', 'null'];
const log = (label, response) => console.log(`${label}: HTTP ${response.status}; ACAO=${response.headers.get('access-control-allow-origin') ?? '(absent)'}; ACAC=${response.headers.get('access-control-allow-credentials') ?? '(absent)'}`);

for (const app of ['client', 'admin']) {
    const vite = await import(pathToFileURL(resolve(root, app, 'node_modules/vite/dist/node/index.js')));
    const config = {
        root: resolve(root, app), logLevel: 'silent',
        server: { host: '127.0.0.1', port: 0 },
        preview: { host: '127.0.0.1', port: 0 },
    };
    const server = preview ? await vite.preview(config) : await vite.createServer(config);
    try {
        if (!preview) await server.listen();
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        for (const origin of origins) {
            const path = preview ? '/' : '/src/main.jsx';
            const response = await fetch(`${base}${path}`, { headers: { Origin: origin } });
            assert.equal(response.status, 200);
            log(`${app} ${preview ? 'preview' : 'dev'} GET ${path} Origin=${origin}`, response);
            await response.text();
            if (!baseline) assert.equal(response.headers.get('access-control-allow-origin'), null);
            const preflight = await fetch(`${base}${path}`, { method: 'OPTIONS', headers: {
                Origin: origin, 'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'content-type',
            } });
            log(`${app} ${preview ? 'preview' : 'dev'} OPTIONS Origin=${origin}`, preflight);
            await preflight.text();
            if (!baseline) assert.equal(preflight.headers.get('access-control-allow-origin'), null);
        }
        const sameOrigin = await fetch(`${base}/login`, { headers: { Accept: 'text/html' } });
        assert.equal(sameOrigin.status, 200);
        assert.ok(sameOrigin.headers.get('content-security-policy'));
        await sameOrigin.text();
        console.log(`PASS: ${app} ${preview ? 'preview' : 'dev'} same-origin HTML still served with CSP`);
    } finally {
        if (preview) {
            server.httpServer.closeAllConnections();
            await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
        } else await server.close();
    }
}

// Exercise the real API app without its production listener/database callback.
// Vite preview sets NODE_ENV=production in this process. Configure explicit
// test origins, so the API's production fail-closed startup remains enabled.
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ADMIN_URL = 'http://localhost:5174';
let app;
const listen = express.application.listen;
express.application.listen = function () { app = this; };
try { await import('../../api/index.js'); } finally { express.application.listen = listen; }
assert.ok(app);
const server = listen.call(app, 0, '127.0.0.1');
await once(server, 'listening');
try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const origin of origins) {
        const approved = origin === origins[0] || origin === origins[1];
        const response = await fetch(`${base}/api/users`, { headers: { Origin: origin } });
        assert.equal(response.status, 401, 'CORS must not bypass authentication');
        log(`API GET /api/users Origin=${origin}`, response);
        await response.text();
        if (!baseline) {
            assert.equal(response.headers.get('access-control-allow-origin'), approved ? origin : null);
            assert.equal(response.headers.get('access-control-allow-credentials'), approved ? 'true' : null);
            if (approved) assert.match(response.headers.get('vary'), /\bOrigin\b/i);
        }
        const preflight = await fetch(`${base}/api/rooms/available/example`, { method: 'OPTIONS', headers: {
            Origin: origin, 'Access-Control-Request-Method': 'PUT',
            'Access-Control-Request-Headers': 'content-type',
        } });
        log(`API OPTIONS PUT Origin=${origin}`, preflight);
        await preflight.text();
        if (!baseline) {
            assert.equal(preflight.headers.get('access-control-allow-origin'), approved ? origin : null);
            assert.equal(preflight.headers.get('access-control-allow-credentials'), approved ? 'true' : null);
            if (approved) {
                assert.equal(preflight.status, 204);
                assert.match(preflight.headers.get('access-control-allow-methods'), /\bPUT\b/);
                assert.match(preflight.headers.get('access-control-allow-headers'), /content-type/i);
            }
        }
    }
    const noOrigin = await fetch(`${base}/api/users`);
    assert.equal(noOrigin.status, 401);
    log('API GET without Origin (authentication still required)', noOrigin);
    await noOrigin.text();
    if (!baseline) assert.equal(noOrigin.headers.get('access-control-allow-origin'), null);
} finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
console.log(`PASS: ${baseline ? 'baseline recorded' : 'CORS assertions passed'}; no credentials, database queries or account mutations used`);
