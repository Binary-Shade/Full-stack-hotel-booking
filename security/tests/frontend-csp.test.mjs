import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Actual Vite HTTP checks. No accounts, secrets, database or browser required.
// --before checks the original missing header; --preview checks built assets.
const root = fileURLToPath(new URL('../../', import.meta.url));
const before = process.argv.includes('--before');
const previewMode = process.argv.includes('--preview');
const requestedApp = process.argv.find(arg => arg.startsWith('--app='))?.split('=')[1];
for (const app of requestedApp ? [requestedApp] : ['client', 'admin']) {
    assert.ok(['client', 'admin'].includes(app));
    const vite = await import(pathToFileURL(resolve(root, app, 'node_modules/vite/dist/node/index.js')));
    const config = {
        root: resolve(root, app),
        logLevel: 'silent',
        server: { host: '127.0.0.1', port: 0 },
        preview: { host: '127.0.0.1', port: 0 },
    };
    const server = previewMode ? await vite.preview(config) : await vite.createServer(config);
    try {
        if (!previewMode) await server.listen();
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        for (const path of ['/', '/login', '/robots.txt', '/sitemap.xml']) {
            const response = await fetch(`${base}${path}`, { headers: { Accept: 'text/html' } });
            const html = await response.text();
            assert.equal(response.status, 200);
            assert.match(response.headers.get('content-type'), /text\/html/);
            const policy = response.headers.get('content-security-policy');
            console.log(`${app} ${previewMode ? 'preview' : 'dev'} GET ${path}: HTTP ${response.status}; CSP: ${policy ?? '(absent)'}`);
            if (before) {
                assert.equal(policy, null);
                continue;
            }
            assert.ok(policy, 'HTML must carry an enforced CSP');
            const directives = Object.fromEntries(policy.split(';').map(part => {
                const [name, ...values] = part.trim().split(/\s+/);
                return [name, values];
            }));
            assert.deepEqual(directives['default-src'], ["'self'"]);
            assert.deepEqual(directives['object-src'], ["'none'"]);
            assert.deepEqual(directives['frame-ancestors'], ["'none'"]);
            assert.deepEqual(directives['form-action'], ["'self'"]);
            assert.deepEqual(directives['script-src-attr'], ["'none'"]);
            assert.ok(!directives['script-src'].some(value => ['*', "'unsafe-inline'", "'unsafe-eval'", 'https:'].includes(value)));
            for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
                if (/\bsrc\s*=/.test(script[1]) || !script[2].trim()) continue;
                const hash = `'sha256-${createHash('sha256').update(script[2]).digest('base64')}'`;
                assert.ok(directives['script-src'].includes(hash), 'every inline Vite preamble must have its exact hash allowed');
            }
            assert.equal(directives['connect-src'].some(value => value.startsWith('ws:')), !previewMode);
            if (app === 'client') {
                assert.ok(directives['script-src'].includes('https://accounts.google.com/gsi/client'));
                assert.ok(directives['frame-src'].includes('https://accounts.google.com/gsi/'));
            } else {
                assert.ok(directives['connect-src'].includes('https://firebasestorage.googleapis.com'));
                assert.ok(directives['connect-src'].includes('https://api.cloudinary.com'));
                assert.ok(!directives['script-src'].some(value => value.includes('accounts.google.com')));
            }
        }
        const asset = await fetch(`${base}/vite.svg`);
        assert.equal(asset.status, 200);
        if (!before) assert.ok(asset.headers.get('content-security-policy'));
        console.log(`PASS: ${app} ${previewMode ? 'preview' : 'dev'} HTML, fallback and asset checks`);
        if (process.argv.includes('--browser')) {
            assert.ok(!before, 'browser enforcement checks require the fixed CSP');
            assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'set Z2_PLAYWRIGHT_MODULE to an installed playwright/index.mjs');
            const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
            const browser = await chromium.launch({ headless: true });
            try {
                const page = await browser.newPage();
                page.on('pageerror', error => {
                    const safeMessage = error.message
                        .replace(/https?:\/\/\S+/g, '[URL omitted]')
                        .replace(/[A-Za-z0-9_-]{20,}/g, '[value omitted]');
                    console.log(`Browser runtime error (${app}): ${safeMessage.slice(0, 200)}`);
                });
                await page.addInitScript(() => {
                    window.__assessmentCspViolations = [];
                    document.addEventListener('securitypolicyviolation', event => {
                        window.__assessmentCspViolations.push(event.effectiveDirective);
                    });
                });
                await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
                await page.waitForFunction(() => document.querySelectorAll('#root input').length >= 2);
                await page.waitForTimeout(1500);
                const violations = await page.evaluate(() => window.__assessmentCspViolations);
                assert.deepEqual(violations, [], 'normal login page must have no CSP violations');
                if (!previewMode) {
                    assert.equal(await page.evaluate(() => window.__vite_plugin_react_preamble_installed__), true);
                }
                await page.evaluate(() => {
                    const script = document.createElement('script');
                    script.textContent = 'window.__assessmentInlineExecuted = true';
                    document.head.append(script);
                });
                await page.waitForFunction(() => window.__assessmentCspViolations.includes('script-src-elem'));
                assert.equal(await page.evaluate(() => window.__assessmentInlineExecuted), undefined);
                await page.screenshot({
                    path: resolve(root, process.env.ASSESSMENT_EVIDENCE_DIR || 'evidence/member4/ZAP-Fixes/Z2-CSP-Header',
                        `12-${app}-${previewMode ? 'preview' : 'dev'}-login.png`),
                    fullPage: true,
                });
                console.log(`PASS: ${app} ${previewMode ? 'preview' : 'dev'} Chromium login rendered, no startup CSP violations, arbitrary inline script blocked`);
            } finally {
                await browser.close();
            }
        }
    } finally {
        if (previewMode) {
            server.httpServer.closeAllConnections();
            await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
        } else {
            await server.close();
        }
    }
}
