import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import express from '../../api/node_modules/express/index.js';

assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'set Z2_PLAYWRIGHT_MODULE to installed playwright/index.mjs');
const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
const servers = [];
let browser;
try {
    const origins = [];
    for (let index = 0; index < 3; index++) {
        const fixture = createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<!doctype html><html><title>CORS assessment fixture</title><body>CORS assessment fixture</body></html>');
        });
        fixture.listen(0, '127.0.0.1');
        servers.push(fixture);
        await once(fixture, 'listening');
        origins.push(`http://127.0.0.1:${fixture.address().port}`);
    }
    // Temporary approved origins isolate browser CORS testing from running apps.
    // Default localhost origins are separately verified by cors-checks.mjs.
    process.env.CLIENT_URL = origins[0];
    process.env.ADMIN_URL = origins[1];
    let app;
    const listen = express.application.listen;
    express.application.listen = function () { app = this; };
    try { await import('../../api/index.js'); } finally { express.application.listen = listen; }
    assert.ok(app);
    const api = listen.call(app, 0, '127.0.0.1');
    servers.push(api);
    await once(api, 'listening');
    const apiUrl = `http://127.0.0.1:${api.address().port}/api/users`;
    browser = await chromium.launch({ headless: true });
    for (let index = 0; index < origins.length; index++) {
        const page = await browser.newPage();
        try {
            await page.goto(origins[index]);
            const result = await page.evaluate(async url => {
                try {
                    const response = await fetch(url, {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const body = await response.json();
                    return { readable: true, status: response.status, message: body.message };
                } catch {
                    return { readable: false };
                }
            }, apiUrl);
            const label = ['approved client', 'approved admin', 'unapproved third origin'][index];
            if (index < 2) {
                assert.deepEqual(result, { readable: true, status: 401, message: 'unauthorized' });
                console.log(`PASS: ${label}: Chromium can read the credential-mode API response after JSON preflight; authentication remains 401`);
            } else {
                assert.deepEqual(result, { readable: false });
                console.log(`PASS: ${label}: Chromium blocks cross-origin API response access`);
            }
        } finally { await page.close(); }
    }
    console.log('Real Chromium CORS enforcement checked with temporary fixture origins; no accounts, cookies or database used.');
} finally {
    if (browser) await browser.close();
    for (const server of servers) {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
}
