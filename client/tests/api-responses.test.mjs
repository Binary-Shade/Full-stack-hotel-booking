import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer, loadConfigFromFile } from 'vite';

// Real Vite proxy and optional Chromium checks, without a database or accounts.
const root = fileURLToPath(new URL('../', import.meta.url));
const configFile = fileURLToPath(new URL('../vite.config.js', import.meta.url));
const { config } = await loadConfigFromFile({ command: 'serve', mode: 'development' }, configFile);
assert.equal(config.server.proxy['/api'].target, 'http://localhost:8001');

let scenario = 'success';
const requests = [];
const hotel = { _id: 'fixture', name: 'Test Hotel', city: 'London', photos: [], cheapestPrice: 100 };
const upstream = createHttpServer((req, res) => {
  requests.push(req.url);
  if (scenario === 'html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<!doctype html><html>Unexpected SPA fallback</html>');
  }
  res.setHeader('Content-Type', 'application/json');
  if (scenario === 'error') {
    res.statusCode = 500;
    return res.end(JSON.stringify({ message: 'Fixture API failure' }));
  }
  if (scenario === 'object') return res.end(JSON.stringify({ unexpected: true }));
  if (scenario === 'null') return res.end('null');
  const data = req.url.startsWith('/api/hotels/countByType')
    ? [{ type: 'hotel', count: 1 }]
    : req.url.startsWith('/api/hotels/countByCity') ? [1, 2, 3] : [hotel];
  res.end(JSON.stringify(data));
});
await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
let vite;
let browser;
try {
  vite = await createServer({
    root,
    configFile,
    logLevel: 'silent',
    server: {
      host: '127.0.0.1', port: 0,
      preTransformRequests: false,
      proxy: { '/api': { target: `http://127.0.0.1:${upstream.address().port}` } },
    },
  });
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  for (const path of ['/api/hotels/countByType', '/api/hotels?featured=true&limit=4']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.ok(Array.isArray(await response.json()));
    assert.ok(requests.includes(path), 'proxy must preserve the API path and query');
  }
  const html = await fetch(`${base}/`);
  assert.match(html.headers.get('content-type'), /text\/html/);
  assert.ok(html.headers.get('content-security-policy'));
  assert.equal(html.headers.get('x-content-type-options'), 'nosniff');
  console.log('PASS: API paths/queries reach the backend; homepage keeps its security headers');

  if (process.argv.includes('--browser')) {
    assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'Set Z2_PLAYWRIGHT_MODULE to an installed Playwright index.mjs');
    const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
    browser = await chromium.launch({ headless: true });
    for (const nextScenario of ['success', 'html', 'object', 'null', 'error', 'success']) {
      scenario = nextScenario;
      const page = await browser.newPage();
      const errors = [];
      const routerWarnings = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.text().includes('React Router Future Flag Warning')) routerWarnings.push(message.text());
      });
      await page.route('https://**/*', route => route.abort());
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      if (scenario === 'success') {
        await page.locator('.pListItem').waitFor();
        await page.locator('.fpName').waitFor();
        assert.equal(await page.locator('.fpName').textContent(), 'Test Hotel');
        assert.equal(await page.locator('[role="alert"]').count(), 0);
      } else {
        await page.waitForFunction(() => document.querySelectorAll('[role="alert"]').length === 3);
        assert.equal(await page.locator('.pListItem, .fpItem').count(), 0);
      }
      assert.deepEqual(errors, [], `${scenario}: homepage must not crash`);
      assert.deepEqual(routerWarnings, [], 'router future warnings must be resolved');
      console.log(`PASS: Chromium homepage handles ${scenario} API responses`);
      await page.close();
    }
  }
} finally {
  await browser?.close();
  await vite?.close();
  upstream.closeAllConnections();
  await new Promise(resolve => upstream.close(resolve));
}
