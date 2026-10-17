import assert from 'node:assert/strict';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from '../../api/node_modules/express/index.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.argv.includes('--before');
const preview = process.argv.includes('--preview');
const record = (label, response) => {
    const value = response.headers.get('x-content-type-options');
    console.log(`${label}: HTTP ${response.status}; Content-Type=${response.headers.get('content-type') ?? '(absent)'}; X-Content-Type-Options=${value ?? '(absent)'}`);
    if (!baseline) assert.equal(value, 'nosniff');
};

for (const app of ['client', 'admin']) {
    const vite = await import(pathToFileURL(resolve(root, app, 'node_modules/vite/dist/node/index.js')));
    const addFixture = server => {
        server.middlewares.use('/__assessment-error', (req, res) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end('local assessment error fixture');
        });
    };
    // Background speculative transforms are unnecessary for HTTP-only checks
    // and can leave pending work when shutting down a short-lived Vite server.
    const serverConfig = { host: '127.0.0.1', port: 0, preTransformRequests: false };
    const config = {
        root: resolve(root, app), logLevel: 'silent',
        server: serverConfig, preview: serverConfig,
        plugins: [{ name: 'local-nosniff-error-fixture', configureServer: addFixture, configurePreviewServer: addFixture }],
    };
    const server = preview ? await vite.preview(config) : await vite.createServer(config);
    try {
        if (!preview) await server.listen();
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        const htmlResponse = await fetch(`${base}/`);
        const html = (await htmlResponse.text()).replace(/<!--[\s\S]*?-->/g, '');
        const script = preview ? html.match(/<script\b[^>]*src="([^"]+)"/)[1] : '/src/main.jsx';
        const cases = [
            ['/', 200, /text\/html/], ['/login', 200, /text\/html/],
            ['/robots.txt', 200, /text\/html/], ['/sitemap.xml', 200, /text\/html/],
            ['/vite.svg', 200, /image\/svg\+xml/], [script, 200, /(?:text|application)\/javascript/],
            ['/fonts/poppins/poppins.css', 200, /text\/css/],
            ['/fonts/poppins/poppins-normal-400-latin.woff2', 200, /font\/woff2/],
            ['/fonts/poppins/OFL.txt', 200, /text\/plain/],
            ['/__assessment-missing.js', 404, null], ['/__assessment-error', 500, null],
        ];
        if (preview) cases.push([html.match(/<link\b[^>]*href="(\/assets\/[^" ]+\.css)"/)[1], 200, /text\/css/]);
        for (const [path, status, mime] of cases) {
            for (const method of ['GET', 'HEAD']) {
                const response = await fetch(`${base}${path}`, { method, headers: { Accept: status === 404 ? 'application/json' : '*/*' } });
                assert.equal(response.status, status, `${app} ${path}`);
                if (mime) assert.match(response.headers.get('content-type'), mime);
                record(`${app} ${preview ? 'preview' : 'dev'} ${method} ${path}`, response);
                await response.text();
            }
        }
    } finally {
        if (preview) {
            server.httpServer.closeAllConnections();
            await new Promise(resolve => server.httpServer.close(resolve));
        } else await server.close();
    }
}

// Test the real API's early responses without invoking database startup.
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.ADMIN_URL = 'http://localhost:5174';
let app;
const listen = express.application.listen;
express.application.listen = function () { app = this; };
try { await import('../../api/index.js'); } finally { express.application.listen = listen; }
const server = listen.call(app, 0, '127.0.0.1');
await once(server, 'listening');
try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [path, options, status] of [
        ['/sitemap.xml', {}, 404], ['/api/users', {}, 401],
        ['/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }, 400],
        ['/api/rooms/available/example', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5174', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' } }, 204],
    ]) {
        const response = await fetch(`${base}${path}`, options);
        assert.equal(response.status, status);
        record(`API ${options.method ?? 'GET'} ${path}`, response);
        await response.text();
    }
} finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
}
console.log(`PASS: ${baseline ? 'baseline recorded; absent headers remain findings' : 'nosniff and MIME assertions passed'}; error paths use a test-only fixture; no accounts/database used`);
