import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.argv.includes('--before');
const preview = process.argv.includes('--preview');
const browserChecks = process.argv.includes('--browser');
const folder = resolve(root, 'evidence/member4/ZAP-Fixes/Z4-Anti-Clickjacking');
let browser;
let attacker;

try {
    if (browserChecks) {
        assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'set Z2_PLAYWRIGHT_MODULE to installed playwright/index.mjs');
        const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
        browser = await chromium.launch({ headless: true });
        attacker = createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<!doctype html><html><title>Local frame assessment</title><body><h1>Local frame assessment</h1></body></html>');
        });
        await new Promise(resolve => attacker.listen(0, '127.0.0.1', resolve));
    }
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
            const label = `${app} ${preview ? 'preview' : 'dev'}`;
            for (const path of ['/', '/login', '/robots.txt', '/sitemap.xml']) {
                for (const method of ['GET', 'HEAD']) {
                    const response = await fetch(`${base}${path}`, { method, headers: { Accept: 'text/html' } });
                    assert.equal(response.status, 200);
                    assert.match(response.headers.get('content-type'), /text\/html/);
                    const policy = response.headers.get('content-security-policy') || '';
                    const xfo = response.headers.get('x-frame-options');
                    assert.match(policy, /(?:^|;)\s*frame-ancestors 'none'(?:;|$)/);
                    assert.equal(xfo, baseline ? null : 'DENY');
                    await response.text();
                    console.log(`PASS: ${label} ${method} ${path}: HTTP ${response.status}; frame-ancestors 'none'; X-Frame-Options=${xfo ?? '(absent)'}`);
                }
            }
            if (!browser) continue;

            const page = await browser.newPage();
            try {
                // A normal top-level visit must still render both empty inputs.
                await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
                await page.waitForFunction(() => document.querySelectorAll('#root input').length >= 2);
                console.log(`PASS: ${label} top-level login renders`);
                const attackerUrl = `http://127.0.0.1:${attacker.address().port}`;
                const scenarios = [
                    { name: 'cross-origin', parent: attackerUrl },
                    { name: 'same-origin', parent: `${base}/__frame-assessment-parent`, fixture: true },
                ];
                if (!baseline) scenarios.push({ name: 'xfo-only-isolation', parent: attackerUrl, isolateXfo: true });
                for (const scenario of scenarios) {
                    const cdp = await page.context().newCDPSession(page);
                    await cdp.send('Audits.enable');
                    let issue;
                    cdp.on('Audits.issueAdded', ({ issue: event }) => {
                        const csp = event.details.contentSecurityPolicyIssueDetails;
                        if (csp?.violatedDirective.startsWith('frame-ancestors')) issue = 'CSP frame-ancestors';
                    });
                    let deniedByXfo = false;
                    const onConsole = message => {
                        const text = message.text();
                        if (text.includes('X-Frame-Options') && /deny/i.test(text)) deniedByXfo = true;
                    };
                    page.on('console', onConsole);
                    if (scenario.fixture) {
                        // The real app's frame-src also restricts child frames.
                        // Use a browser-only same-origin parent fixture without
                        // that parent policy to isolate the child's protection.
                        await page.route(scenario.parent, route => route.fulfill({
                            contentType: 'text/html',
                            body: '<!doctype html><html><title>Same-origin frame fixture</title><body>Same-origin frame fixture</body></html>',
                        }));
                    }
                    await page.goto(scenario.parent, { waitUntil: 'domcontentloaded' });
                    issue = undefined;
                    deniedByXfo = false;
                    if (scenario.isolateXfo) {
                        // Explicit browser-only isolation: remove CSP from the
                        // framed response to verify XFO independently. The app
                        // still sends both headers; this is not a server result.
                        await page.route(`${base}/login?frame-assessment=*`, async route => {
                            const response = await route.fetch();
                            const headers = response.headers();
                            delete headers['content-security-policy'];
                            await route.fulfill({ response, headers });
                        });
                    }
                    await page.evaluate(url => {
                        const iframe = document.createElement('iframe');
                        iframe.id = 'assessment-frame';
                        iframe.title = 'Attempted application embedding';
                        iframe.width = '900';
                        iframe.height = '450';
                        iframe.src = url;
                        document.body.append(iframe);
                    }, `${base}/login?frame-assessment=${scenario.name}`);
                    const limit = Date.now() + 15000;
                    while (!issue && !deniedByXfo && Date.now() < limit) await page.waitForTimeout(100);
                    assert.ok(scenario.isolateXfo ? deniedByXfo : issue, `${label}: browser must report frame refusal for ${scenario.name}`);
                    assert.equal(await page.locator('#assessment-frame').contentFrame().locator('#root input').count(), 0);
                    if (!baseline && scenario.name === 'cross-origin') {
                        await page.screenshot({ path: resolve(folder, `12-${app}-${preview ? 'preview' : 'dev'}-blocked-frame.png`), fullPage: true });
                    }
                    console.log(`PASS: ${label} ${scenario.name} embedding blocked by ${scenario.isolateXfo ? 'X-Frame-Options DENY (CSP stripped only in test browser)' : issue}; no login inputs rendered inside frame`);
                    page.off('console', onConsole);
                    await cdp.detach();
                    if (scenario.fixture) await page.unroute(scenario.parent);
                    if (scenario.isolateXfo) await page.unrouteAll();
                }
            } finally { await page.close(); }
        } finally {
            if (preview) {
                server.httpServer.closeAllConnections();
                await new Promise(resolve => server.httpServer.close(resolve));
            } else await server.close();
        }
    }
} finally {
    if (browser) await browser.close();
    if (attacker) {
        attacker.closeAllConnections();
        await new Promise(resolve => attacker.close(resolve));
    }
}
console.log(`PASS: ${baseline ? 'pre-Z4 baseline' : 'frame protection'} checks complete; no accounts, cookies or database used`);
