import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiCorsOptions } from '../config/cors.js';

function allowed(options, origin) {
    let result;
    options.origin(origin, (error, value) => {
        assert.equal(error, null);
        result = value;
    });
    return result;
}

test('development defaults match only the client and admin origins', () => {
    const options = apiCorsOptions({});
    assert.equal(allowed(options, 'http://localhost:5173'), true);
    assert.equal(allowed(options, 'http://localhost:5174'), true);
    for (const origin of [undefined, 'null', 'https://untrusted.example',
        'http://localhost:5173.untrusted.example', 'http://localhost:5173/',
        'https://localhost:5173', 'http://127.0.0.1:5173']) {
        assert.equal(allowed(options, origin), false);
    }
});

test('configured origins replace local defaults and allow credentialed JSON requests', () => {
    const options = apiCorsOptions({
        CLIENT_URL: 'https://booking.example', ADMIN_URL: 'https://admin.example',
    });
    assert.equal(allowed(options, 'https://booking.example'), true);
    assert.equal(allowed(options, 'https://admin.example'), true);
    assert.equal(allowed(options, 'http://localhost:5173'), false);
    assert.equal(options.credentials, true);
    assert.deepEqual(options.allowedHeaders, ['Content-Type']);
    assert.ok(options.methods.includes('PUT'));
    assert.ok(options.methods.includes('DELETE'));
});

test('production requires both explicit origins', () => {
    assert.throws(() => apiCorsOptions({ NODE_ENV: 'production' }), /CLIENT_URL/);
    assert.throws(() => apiCorsOptions({
        NODE_ENV: 'production', CLIENT_URL: 'https://booking.example',
    }), /ADMIN_URL/);
    const options = apiCorsOptions({
        NODE_ENV: 'production', CLIENT_URL: 'https://booking.example', ADMIN_URL: 'https://admin.example',
    });
    assert.equal(allowed(options, 'http://localhost:5174'), false);
    assert.equal(allowed(options, 'https://admin.example'), true);
});

test('wildcards, malformed URLs and non-origin URL components fail closed', () => {
    for (const value of ['*', 'null', '', 'https://*.example', 'file:///example',
        'https://booking.example/', 'https://booking.example/path',
        'https://booking.example?query', 'https://booking.example#fragment',
        'https://user@booking.example', ' https://booking.example']) {
        assert.throws(() => apiCorsOptions({ CLIENT_URL: value }), /CLIENT_URL/);
    }
});
