import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Check served HTML declarations only, not dynamically inserted SDK resources.
// --before records the original Google Fonts stylesheet without SRI.
const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = process.argv.includes('--before');
for (const app of ['client', 'admin']) {
    const vite = await import(pathToFileURL(resolve(root, app, 'node_modules/vite/dist/node/index.js')));
    const server = await vite.createServer({
        root: resolve(root, app), logLevel: 'silent',
        server: { host: '127.0.0.1', port: 0 },
    });
    try {
        await server.listen();
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        for (const path of ['/', '/sitemap.xml']) {
            const response = await fetch(`${base}${path}`, { headers: { Accept: 'text/html' } });
            assert.equal(response.status, 200);
            const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
            const external = [];
            for (const tag of html.matchAll(/<(script|link)\b([^>]*)>/gi)) {
                const attrs = Object.fromEntries([...tag[2].matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/gs)]
                    .map(match => [match[1].toLowerCase(), match[3]]));
                const script = tag[1].toLowerCase() === 'script';
                if (!script && !attrs.rel?.split(/\s+/).includes('stylesheet')) continue;
                const source = script ? attrs.src : attrs.href;
                if (!source) continue;
                const url = new URL(source, base);
                if (url.origin !== base) external.push({ url, integrity: attrs.integrity });
            }
            console.log(`${app} GET ${path}: HTTP ${response.status}; external script/stylesheet declarations=${external.length}`);
            if (baseline) {
                assert.ok(external.some(item => item.url.hostname === 'fonts.googleapis.com' && !item.integrity));
                console.log('CONFIRMED: active external Google Fonts stylesheet has no integrity attribute');
            } else {
                assert.equal(external.length, 0, 'self-hosting remediation requires local static script/stylesheet declarations');
            }
        }
    } finally { await server.close(); }
}
console.log(`PASS: ${baseline ? 'original declaration reproduced; vulnerability remains unresolved' : 'static external dependency removed'}; no font download or browser claim`);
