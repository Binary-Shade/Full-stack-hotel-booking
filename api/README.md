# API CORS configuration (SE4030 Z3)

`config/cors.js` authorizes exact frontend origins. Local defaults are
`http://localhost:5173` (client) and `http://localhost:5174` (admin).
Override them using `CLIENT_URL` and `ADMIN_URL` in the API's local environment:

```dotenv
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
```

Values must be HTTP(S) origins with no trailing slash, path, wildcard,
credentials, query or fragment. Each variable replaces its corresponding local
default. In `NODE_ENV=production`, both variables must be explicitly configured;
missing/invalid settings stop startup without logging the values.

Approved origins receive their matching Access-Control-Allow-Origin and
Access-Control-Allow-Credentials: true. Other origins, including literal `null`,
receive no CORS permission. Responses vary by Origin for caching. Preflights
permit existing route methods and Content-Type for JSON requests. Authentication
remains required; CORS does not authorize users or block non-browser clients.

The admin same-origin `/api` development proxy remains in place. Direct API
calls can now receive permission from the admin origin. Direct cross-origin
cookie requests still require the browser caller to opt into credentials;
this change does not rewrite application requests or authentication.

Both Vite apps disable asset CORS in development and preview because each app
loads its own assets from its own origin. A different local host/port requires
matching API origin settings; a deployed API also requires aligned frontend CSP.

Run from the repository root:

```powershell
node --test api/tests/cors-options.test.js api/tests/z1-security-headers.test.js
node security/tests/cors-checks.mjs
node security/tests/cors-checks.mjs --preview
```

Preview checks require both dist builds. Browser checks use an installed
Playwright module through `Z2_PLAYWRIGHT_MODULE`:

```powershell
node security/tests/cors-browser-checks.mjs
```

The browser check uses the actual API with temporary fixture origins. It
confirms approved origins can read a credential-mode 401 response while
Chromium blocks an unapproved origin. It uses no accounts, cookies or database.
See the Z3 summary for local ZAP instructions and pending application tests.
