import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const preview = process.argv.includes('--preview');
const browserChecks = process.argv.includes('--browser');
const digest = bytes => createHash('sha384').update(bytes).digest('base64');
let browser;
try {
    if (browserChecks) {
        assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'set Z2_PLAYWRIGHT_MODULE to installed playwright/index.mjs');
        const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
        browser = await chromium.launch({ headless: true });
    }
    for (const app of ['client', 'admin']) {
        const directory = resolve(root, app, 'public/fonts/poppins');
        const manifest = JSON.parse(await readFile(resolve(directory, 'provenance.json'), 'utf8'));
        assert.equal(manifest.files.length, 54);
        assert.deepEqual([...new Set(manifest.files.map(file => file.weight))].sort((a, b) => a - b), [100, 200, 300, 400, 500, 600, 700, 800, 900]);
        assert.deepEqual([...new Set(manifest.files.map(file => file.style))].sort(), ['italic', 'normal']);
        assert.deepEqual([...new Set(manifest.files.map(file => file.subset))].sort(), ['devanagari', 'latin', 'latin-ext']);
        for (const entry of [...manifest.files, manifest.stylesheet, manifest.license]) {
            const bytes = await readFile(resolve(directory, entry.file));
            assert.equal(digest(bytes), entry.sha384, `${app}: local provenance digest mismatch`);
            if (entry.file.endsWith('.woff2')) {
                assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2');
                assert.equal(bytes.readUInt32BE(8), bytes.length);
            }
        }
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
            for (const path of ['/', '/sitemap.xml']) {
                const response = await fetch(`${base}${path}`);
                assert.equal(response.status, 200);
                const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
                const link = html.match(/<link\b[^>]*href="\/fonts\/poppins\/poppins\.css"[^>]*>/)?.[0];
                assert.ok(link, 'active self-hosted stylesheet link must be present');
                assert.ok(link.includes(`integrity="sha384-${manifest.stylesheet.sha384}"`));
                assert.ok(link.includes('crossorigin="anonymous"'));
                assert.ok(!html.includes('fonts.googleapis.com'));
                const csp = response.headers.get('content-security-policy');
                assert.ok(!csp.includes('fonts.googleapis.com') && !csp.includes('fonts.gstatic.com'));
                console.log(`PASS: ${label} GET ${path}: local CSS, actual SHA-384 integrity, anonymous crossorigin, reduced font CSP`);
            }
            for (const entry of [...manifest.files, manifest.stylesheet, manifest.license]) {
                const response = await fetch(`${base}/fonts/poppins/${entry.file}`);
                assert.equal(response.status, 200);
                const bytes = Buffer.from(await response.arrayBuffer());
                assert.equal(digest(bytes), entry.sha384, `${label}: served asset digest mismatch`);
                if (entry.file.endsWith('.woff2')) assert.match(response.headers.get('content-type'), /font\/woff2/);
            }
            console.log(`PASS: ${label}: all 54 font responses plus CSS/license match actual recorded SHA-384 bytes`);
            if (!browser) continue;
            const page = await browser.newPage();
            try {
                const externalFonts = [];
                page.on('request', request => {
                    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(request.url()).hostname)) externalFonts.push(true);
                });
                await page.addInitScript(() => {
                    window.__fontAssessmentViolations = [];
                    document.addEventListener('securitypolicyviolation', event => window.__fontAssessmentViolations.push(event.effectiveDirective));
                });
                await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
                await page.waitForFunction(() => document.querySelectorAll('#root input').length >= 2);
                const loaded = await page.evaluate(async () => {
                    let count = 0;
                    for (const style of ['normal', 'italic']) {
                        for (let weight = 100; weight <= 900; weight += 100) {
                            for (const text of ['Booking', 'Ā', 'होटल']) {
                                const faces = await document.fonts.load(`${style} ${weight} 20px Poppins`, text);
                                if (faces.length === 0 || faces.some(face => face.status !== 'loaded')) throw new Error('Poppins face did not load');
                                count++;
                            }
                        }
                    }
                    return count;
                });
                assert.equal(loaded, 54);
                assert.equal(externalFonts.length, 0);
                assert.deepEqual(await page.evaluate(() => window.__fontAssessmentViolations), []);
                await page.evaluate(() => {
                    const specimen = document.createElement('section');
                    specimen.style.cssText = 'font-family:Poppins; padding:24px; background:white; color:black;';
                    const title = document.createElement('h2');
                    title.textContent = 'Local Poppins font verification';
                    specimen.append(title);
                    for (const weight of [100, 400, 700, 900]) {
                        const line = document.createElement('p');
                        line.style.cssText = `font-family:Poppins; font-size:20px; font-weight:${weight}; margin:8px;`;
                        line.textContent = `Weight ${weight}: Booking Ā होटल`;
                        specimen.append(line);
                    }
                    document.body.append(specimen);
                });
                await page.screenshot({ path: resolve(root, process.env.ASSESSMENT_EVIDENCE_DIR || 'evidence/member4/ZAP-Fixes/Z5-Subresource-Integrity', `16-${app}-${preview ? 'preview' : 'dev'}-fonts.png`), fullPage: true });
                console.log(`PASS: ${label} Chromium: 54 font/style/subset loads, login rendered, no external Google Fonts requests or CSP violations`);
            } finally { await page.close(); }
        } finally {
            if (preview) {
                server.httpServer.closeAllConnections();
                await new Promise(resolve => server.httpServer.close(resolve));
            } else await server.close();
        }
    }
} finally { if (browser) await browser.close(); }
