import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, mock, test } from 'node:test';
import express from 'express';
import Hotel from '../models/Hotel.js';

// Import the actual app without starting its production listener or MongoDB.
// These HTTP checks cover middleware and routing, not database/browser flows.
let server;
let baseUrl;

before(async () => {
    let app;
    const originalListen = express.application.listen;
    express.application.listen = function () {
        app = this;
    };
    try {
        await import('../index.js');
    } finally {
        express.application.listen = originalListen;
    }
    assert.ok(app, 'index.js must register its Express app');
    server = originalListen.call(app, 0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    mock.restoreAll();
    if (server) {
        server.closeAllConnections();
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
});

function assertCsp(response) {
    const policy = response.headers.get('content-security-policy') || '';
    assert.match(policy, /(?:^|;)\s*default-src 'none'(?:;|$)/);
    assert.match(policy, /(?:^|;)\s*frame-ancestors 'none'(?:;|$)/);
    assert.match(policy, /(?:^|;)\s*form-action 'self'(?:;|$)/);
}

for (const [method, path] of [
    ['GET', '/sitemap.xml'],
    ['HEAD', '/sitemap.xml'],
    ['GET', '/robots.txt'],
    ['GET', '/api/not-a-route'],
    ['POST', '/api/not-a-route'],
]) {
    test(`${method} ${path}: 404 retains explicit CSP directives`, async () => {
        const response = await fetch(`${baseUrl}${path}`, { method });
        assert.equal(response.status, 404);
        assertCsp(response);
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.match(response.headers.get('content-type'), /^application\/json\b/);
        if (method === 'HEAD') {
            assert.equal(await response.text(), '');
        } else {
            assert.deepEqual(await response.json(), {
                success: false,
                status: 404,
                message: 'route not found',
            });
        }
    });
}

test('registered users route retains authentication and CSP', async () => {
    const response = await fetch(`${baseUrl}/api/users`);
    assert.equal(response.status, 401);
    assertCsp(response);
    assert.equal((await response.json()).message, 'unauthorized');
});

test('registered hotel route still succeeds (database query stubbed)', async () => {
    const find = mock.method(Hotel, 'find', () => ({ limit: async () => [] }));
    try {
        const response = await fetch(`${baseUrl}/api/hotels`);
        assert.equal(response.status, 200);
        assertCsp(response);
        assert.deepEqual(await response.json(), []);
        assert.equal(find.mock.callCount(), 1);
    } finally {
        find.mock.restore();
    }
});

test('registered hotel route retains invalid-ID error handling', async () => {
    const response = await fetch(`${baseUrl}/api/hotels/not-an-object-id`);
    assert.equal(response.status, 400);
    assertCsp(response);
    assert.equal((await response.json()).message, 'invalid id');
});
