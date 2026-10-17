import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

// Run with Z2_PLAYWRIGHT_MODULE pointing at an installed Playwright index.mjs.
// All accounts, cookies, hotels and room updates here are local fixtures.
assert.ok(process.env.Z2_PLAYWRIGHT_MODULE, 'Set Z2_PLAYWRIGHT_MODULE to an installed Playwright index.mjs');
const { chromium } = await import(pathToFileURL(process.env.Z2_PLAYWRIGHT_MODULE));
const root = fileURLToPath(new URL('../', import.meta.url));
const hotel = { _id: 'hotel1', name: 'London Hotel', city: 'london', type: 'hotel', photos: [], cheapestPrice: 100, desc: 'Test property', address: 'Test address' };
const apartment = { ...hotel, _id: 'hotel2', type: 'apartment', name: 'London Apartment', cheapestPrice: 200 };
const requests = [];
let rejectLogin = false;
let rejectReservation = false;
const api = createHttpServer(async (req, res) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : undefined;
  requests.push({ method: req.method, path: req.url, body, cookie: req.headers.cookie });
  const url = new URL(req.url, 'http://fixture');
  let data;
  if (url.pathname === '/api/auth/register') {
    res.statusCode = 201;
    data = { msg: 'user saved' };
  } else if (url.pathname === '/api/auth/login') {
    res.statusCode = rejectLogin ? 401 : 200;
    if (!rejectLogin) res.setHeader('Set-Cookie', 'access_token=fixture; HttpOnly; SameSite=Strict; Path=/');
    data = rejectLogin ? { message: 'Invalid test credentials' } : { details: { _id: 'test-user', username: 'test-user', email: 'fixture@example.test' } };
  } else if (url.pathname === '/api/auth/logout') {
    res.setHeader('Set-Cookie', 'access_token=; Max-Age=0; Path=/');
    data = { msg: 'logged out' };
  } else if (url.pathname === '/api/hotels/countByType') {
    data = [{ type: 'hotel', count: 1 }, { type: 'apartment', count: 1 }];
  } else if (url.pathname === '/api/hotels/countByCity') {
    data = [0, 2, 0];
  } else if (url.pathname === '/api/hotels/room/hotel1') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    data = [{ _id: 'room1', title: 'Double room', maxpeople: 2, price: 100, desc: 'Fixture room', roomNumbers: [
      { _id: 'number1', number: 101, unavailableDates: [] },
      { _id: 'number2', number: 102, unavailableDates: [today.toISOString()] },
    ] }];
  } else if (url.pathname === '/api/rooms/available/number1') {
    res.statusCode = rejectReservation ? 409 : 200;
    data = rejectReservation ? { message: 'Room already booked for those dates' } : 'dates updated successfully';
  } else if (url.pathname === '/api/hotels/hotel1') {
    data = hotel;
  } else if (url.pathname === '/api/hotels') {
    data = [hotel, apartment].filter(item =>
      (!url.searchParams.get('city') || item.city === url.searchParams.get('city')) &&
      (!url.searchParams.get('type') || item.type === url.searchParams.get('type')) &&
      (!url.searchParams.has('min') || item.cheapestPrice >= Number(url.searchParams.get('min'))) &&
      (!url.searchParams.has('max') || item.cheapestPrice <= Number(url.searchParams.get('max'))));
    if (url.searchParams.get('featured')) data = [hotel];
  } else {
    res.statusCode = 404;
    data = { message: 'Fixture route not found' };
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
let vite;
let browser;
try {
  vite = await createServer({ root, logLevel: 'silent', server: { host: '127.0.0.1', port: 0, preTransformRequests: false,
    proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}` } },
  } });
  await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://**/*', route => route.abort());
  const home = () => page.goto(base, { waitUntil: 'domcontentloaded' });
  const login = async () => {
    await page.getByLabel('Username', { exact: true }).fill('test-user');
    await page.getByLabel('Password', { exact: true }).fill('fixture-password');
    await page.getByLabel('Password', { exact: true }).press('Enter');
  };
  const logout = async () => {
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await page.getByRole('link', { name: 'Login', exact: true }).waitFor();
  };

  await home();
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/login');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  assert.equal(requests.filter(req => req.path === '/api/auth/login').length, 0, 'empty login must not submit');
  rejectLogin = true;
  await login();
  await page.getByRole('alert').filter({ hasText: 'Invalid test credentials' }).waitFor();
  rejectLogin = false;
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: 'Log out', exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => Object.keys(JSON.parse(sessionStorage.getItem('user'))).sort()), ['_id', 'username']);
  await logout();
  console.log('PASS: Login link, required fields, Enter submission, error recovery and server logout');

  await page.getByRole('link', { name: 'Register', exact: true }).click();
  for (const [label, value] of Object.entries({ Username: 'test-user', Email: 'fixture@example.test', Country: 'Sri Lanka', City: 'Colombo', Phone: '0771234567', Password: 'fixture-password', 'Confirm password': 'different' })) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Passwords do not match' }).waitFor();
  assert.equal(requests.filter(req => req.path === '/api/auth/register').length, 0);
  await page.getByLabel('Confirm password', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Account created' }).waitFor();
  assert.equal(requests.find(req => req.path === '/api/auth/register').body.phone, '0771234567');
  await page.getByRole('link', { name: 'Back to home', exact: true }).click();
  await page.getByRole('link', { name: 'Sign in / Register', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/login');
  await home();
  console.log('PASS: Registration page, password confirmation, API submission and sign-in banner');

  const services = page.getByRole('navigation', { name: 'Travel services' });
  for (const label of ['Flights', 'Car rentals', 'Attractions', 'Airport taxis']) {
    await services.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('status').filter({ hasText: label + ': Coming soon' }).waitFor();
    await page.getByRole('button', { name: 'Dismiss notice', exact: true }).click();
  }
  await services.getByRole('link', { name: 'Stays' }).click();
  await page.locator('.searchItem').first().waitFor();
  assert.equal(await page.locator('.searchItem').count(), 2, 'Stays must show all hotels');
  await home();
  await page.getByRole('button', { name: 'Choose dates', exact: true }).click();
  await page.locator('.rdrDateRangeWrapper').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.rdrDateRangeWrapper').count(), 0);
  await page.getByRole('button', { name: 'Choose guests and rooms', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Fewer adults' }).isDisabled(), true);
  await page.getByRole('button', { name: 'More adults' }).click();
  await page.getByRole('button', { name: 'More children' }).click();
  await page.getByRole('button', { name: 'More rooms' }).click();
  await page.getByLabel('Destination', { exact: true }).fill('london');
  await page.getByLabel('Destination', { exact: true }).press('Enter');
  await page.locator('.searchItem').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get('city'), 'london');
  assert.equal(await page.getByLabel('Adults', { exact: true }).inputValue(), '2');
  assert.equal(await page.getByLabel('Rooms', { exact: true }).inputValue(), '2');
  await page.getByLabel('Minimum price').fill('101');
  await page.getByLabel('Maximum price').fill('100');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Maximum price' }).waitFor();
  await page.getByLabel('Minimum price').fill('0');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.searchItem').length === 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.searchItem').first().waitFor();
  assert.equal(await page.getByLabel('Adults', { exact: true }).inputValue(), '2');
  assert.equal(await page.getByLabel('Maximum price').inputValue(), '100');
  await page.getByLabel('Destination', { exact: true }).fill('no-results');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByText('No properties match your search.').waitFor();
  console.log('PASS: Service tabs, date picker, guest counters, Enter search, filters, reload and empty results');

  await home();
  await page.locator('.featuredItem').nth(1).click();
  await page.locator('.searchItem').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get('city'), 'london');
  await home();
  await page.locator('.pListItem').nth(1).click();
  await page.locator('.searchItem').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get('type'), 'apartment');
  assert.equal(await page.locator('.siTitle').textContent(), 'London Apartment');
  await home();
  await page.locator('.fpItem').first().click();
  await page.getByRole('heading', { name: 'London Hotel', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reserve or Book Now!', exact: true }).first().click();
  await page.getByRole('button', { name: 'Log in', exact: true }).waitFor();
  await login();
  await page.getByRole('heading', { name: 'London Hotel', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/hotels/hotel1');
  await page.getByRole('button', { name: 'Reserve or Book Now!', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Reserve a room' });
  await dialog.waitFor();
  await dialog.getByLabel('Select room', { exact: true }).selectOption('room1');
  assert.equal(await dialog.getByRole('button', { name: 'Reserve now', exact: true }).isDisabled(), true);
  assert.equal(await dialog.getByLabel('Room 102 (unavailable)', { exact: true }).isDisabled(), true);
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(), 0);
  await page.getByRole('button', { name: 'Reserve or Book Now!', exact: true }).last().click();
  await dialog.getByLabel('Select room', { exact: true }).selectOption('room1');
  await dialog.getByLabel('Room 101', { exact: true }).check();
  rejectReservation = true;
  await dialog.getByRole('button', { name: 'Reserve now', exact: true }).click();
  await dialog.getByRole('alert').filter({ hasText: 'already booked' }).waitFor();
  rejectReservation = false;
  await dialog.getByLabel('Room 101', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Reserve now', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'rooms have been reserved' }).waitFor();
  const reservation = requests.find(req => req.path === '/api/rooms/available/number1');
  assert.ok(reservation.body.dates.length >= 1);
  assert.match(reservation.cookie, /access_token=fixture/);
  await page.evaluate(() => localStorage.removeItem('searchState'));
  await page.goto(base + '/hotels/hotel1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Reserve or Book Now!', exact: true }).first().click();
  await dialog.getByLabel('Select room', { exact: true }).selectOption('room1');
  await dialog.getByRole('button', { name: 'Close reservation' }).click();
  assert.equal(await dialog.count(), 0, 'direct hotel visits must support reservation without saved dates');
  console.log('PASS: City/type/hotel cards, return after login, reservation dialog, unavailable rooms and conflict recovery');

  await home();
  await page.getByLabel('Newsletter email').fill('fixture@example.test');
  await page.getByRole('button', { name: 'Subscribe', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Newsletter subscriptions are coming soon' }).waitFor();
  await page.getByRole('navigation', { name: 'Explore Book N Rest' }).getByRole('button', { name: 'Flight Finder', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Flight Finder: Coming soon' }).waitFor();
  await page.getByRole('navigation', { name: 'Explore Book N Rest' }).getByRole('link', { name: 'Apartments', exact: true }).click();
  await page.locator('.searchItem').first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get('type'), 'apartment');
  await page.goto(base + '/missing-page', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Back to home', exact: true }).click();
  await page.locator('.fpItem').first().waitFor();
  assert.deepEqual(errors, [], 'all navigation flows must avoid runtime errors');
  console.log('PASS: Footer links, unavailable features, newsletter feedback and unknown-route recovery');
} finally {
  await browser?.close();
  await vite?.close();
  api.closeAllConnections();
  await new Promise(resolve => api.close(resolve));
}
