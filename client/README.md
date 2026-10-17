# Client development

Start the Express API from `api` with `npm run dev` (port 8001), then run
`npm run dev` from this directory. Vite proxies `/api` requests to
`http://localhost:8001`, including authentication cookies. Restart Vite after
changing its proxy configuration.

The API requires its existing MongoDB and authentication environment settings.
If the API is unavailable or returns HTML instead of JSON, the homepage shows
an error message in the affected sections.

Run `node client/tests/api-responses.test.mjs` from the repository root to check
the proxy using a local fixture API. Add `--browser` and set
`Z2_PLAYWRIGHT_MODULE` to an installed Playwright `index.mjs` to also verify
successful, HTML, invalid-shape, null and failed responses in Chromium.

Production hosting must forward `/api` to Express before applying the SPA
HTML fallback. The Vite development proxy does not configure deployed hosting.

## Navigation and account flows

Login, registration, hotel search, property cards and room reservations use
the existing Express endpoints. Search filters are kept in the URL, and dates
and guest counts are restored from browser storage. Room reservation requires
login and returns the user to the selected hotel afterward. Check-out dates
are excluded from reserved nights; stays are limited to the API's 30-night cap.

Flights, car rentals, attractions, airport taxis, newsletter subscriptions and
footer sections without backend support show a clear “Coming soon” notice.

With `Z2_PLAYWRIGHT_MODULE` pointing to an installed Playwright `index.mjs`, run
`node client/tests/navigation.test.mjs` from the repository root. It exercises
navigation, registration/login/logout, search filters and refresh, room selection,
booking conflicts and unsupported controls against a temporary local fixture API.
No real accounts or reservations are created. Backend price validation is covered
by `node --test api/tests/hotel-search.test.js` without connecting to MongoDB.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
