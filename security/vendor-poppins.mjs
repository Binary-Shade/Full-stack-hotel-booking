import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicit maintenance command, not part of the app/build. Run only when a
// font download/update is authorized. Both apps get identical reviewed assets.
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = resolve(root, 'evidence/member4/ZAP-Fixes/Z5-Subresource-Integrity');
const source = await readFile(resolve(evidence, '09-original-fonts-response.css'), 'utf8');
const stylesheetUrl = 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
const licenseUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt';
const digest = content => createHash('sha384').update(content).digest('base64');
const entries = [...source.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g)].map(match => {
    const subset = match[1];
    const block = match[2];
    const style = block.match(/font-style:\s*(normal|italic);/)[1];
    const weight = Number(block.match(/font-weight:\s*(\d+);/)[1]);
    const url = block.match(/url\((https:\/\/[^)]+)\)/)[1];
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://fonts.gstatic.com');
    assert.match(parsed.pathname, /^\/s\/poppins\/v\d+\/[\w-]+\.woff2$/);
    return { file: `poppins-${style}-${weight}-${subset}.woff2`, style, weight, subset, sourceUrl: url };
});
assert.equal(entries.length, 54, 'preserve all 9 weights, 2 styles and 3 Unicode subsets');
assert.equal(new Set(entries.map(entry => entry.file)).size, entries.length);

async function download(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    assert.ok(response.ok, `public font source returned HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
}

const license = await download(licenseUrl);
assert.match(license.toString('utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
const contents = new Map();
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < entries.length) {
        const entry = entries[next++];
        const content = await download(entry.sourceUrl);
        assert.equal(content.subarray(0, 4).toString('ascii'), 'wOF2');
        assert.equal(content.readUInt32BE(8), content.length, 'WOFF2 declared byte length must match');
        entry.bytes = content.length;
        entry.sha384 = digest(content);
        contents.set(entry.file, content);
    }
}));

let localCss = source;
for (const entry of entries) localCss = localCss.replaceAll(entry.sourceUrl, `./${entry.file}`);
assert.ok(!localCss.includes('https://'));
localCss = '/* SE4030 SECURITY FIX - Z5: self-host Poppins; see OFL.txt and provenance.json. */\n' + localCss;
const manifest = JSON.stringify({
    family: 'Poppins', retrievedAtUtc: new Date().toISOString(),
    sourceStylesheet: { url: stylesheetUrl, sha384: digest(source) },
    license: { file: 'OFL.txt', url: licenseUrl, sha384: digest(license) },
    stylesheet: { file: 'poppins.css', sha384: digest(localCss) },
    files: entries,
}, null, 2) + '\n';
for (const app of ['client', 'admin']) {
    const directory = resolve(root, app, 'public/fonts/poppins');
    await mkdir(directory, { recursive: true });
    // Never overwrite an existing edited asset; a reviewed update must use an
    // explicit diff rather than quietly replacing it through this command.
    const files = new Map([...contents, ['OFL.txt', license], ['poppins.css', localCss], ['provenance.json', manifest]]);
    for (const [name, content] of files) await writeFile(resolve(directory, name), content, { flag: 'wx' });
    console.log(`${app}: saved ${entries.length} verified WOFF2 files, local CSS, OFL license and SHA-384 provenance`);
}
console.log(`Downloaded font bytes: ${entries.reduce((total, entry) => total + entry.bytes, 0)} per app; no HTML/CSP changed by this command.`);
