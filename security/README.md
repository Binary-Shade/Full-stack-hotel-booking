# Frontend CSP (SE4030 Z2)

`frontendCsp.mjs` supplies the enforced `Content-Security-Policy` header for both
Vite development servers and both Vite preview servers. The API has its own
Helmet policy. Original frontend configuration had no CSP headers; Git history
and the assessment's original response excerpts preserve that missing control.

The development policy hashes the exact installed React plugin refresh preamble
using the current default Vite base `/`. If the base changes, update that hash's
input and rerun the HTTP/browser checks. Preview permits neither that inline
script nor development WebSocket connections. Neither policy permits arbitrary
inline JavaScript or `eval`.

| Resource | Allowance and reason |
| --- | --- |
| Scripts | Same origin; Google Identity Services client script on the client app only |
| Styles | Same origin and GIS style on client; inline styles required by React style props, Vite CSS injection and MUI/Emotion |
| Fonts | Same origin; Poppins is self-hosted with its OFL license and provenance |
| Images | Same origin, data/blob previews and HTTPS images; hotel/user image URLs are stored in application data |
| Connections | Same origin, the existing local API, GIS on client, Firebase Storage and Cloudinary uploads on admin |
| Development HMR | Loopback WebSockets; Vite can choose a free port |
| Frames | GIS child frames on client; no child frames on admin |
| Embedding/forms | Explicit frame-ancestors 'none' and form-action 'self' |

No maps integration was found in the current source, so no map providers were
added to the policy. Z4 supplements the existing `frame-ancestors 'none'` with
`X-Frame-Options: DENY` on both development/preview servers. Actual browser
checks block same-origin and cross-origin embedding; local ZAP validation is
still pending. Z3 now disables Vite asset CORS in
development/preview and configures the API's client/admin origin allowlist;
see `api/README.md`. Z5 self-hosts Poppins and pins its local CSS with SRI.
Z6 installs early nosniff middleware in Vite and Express, including short-circuit
and error responses. ZAP verification remains pending for all six findings.

## Checks

From the repository root, with dependencies installed in both apps:

```powershell
node security/tests/frontend-csp.test.mjs
npm.cmd --prefix client run build
npm.cmd --prefix admin run build
node security/tests/frontend-csp.test.mjs --preview
```

The HTTP checks use actual Vite servers on temporary loopback ports and verify
HTML, fallback responses, a static asset, required directives, and exact hashes
of every inline script in the returned HTML. `--before` is for reproducing the
original missing control before a change; it is expected to fail after the fix.

Optional Chromium checks use an existing Playwright installation. Set
`Z2_PLAYWRIGHT_MODULE` to its absolute `playwright/index.mjs` path, then run:

```powershell
node security/tests/frontend-csp.test.mjs --browser
node security/tests/frontend-csp.test.mjs --preview --browser
```

These visit the empty login forms, check startup CSP violations and refresh
startup, and confirm arbitrary inline script injection is blocked. They do not
submit credentials or validate authenticated/backend/storage workflows.

## Production hosting

`vite build` produces static files, which cannot set HTTP response headers by
themselves. Vite preview checks the production bundle locally; it is not the
deployment configuration. The actual static host or reverse proxy must send
the corresponding CSP and `X-Frame-Options: DENY` headers on HTML and SPA
fallback responses, and `X-Content-Type-Options: nosniff` with correct MIME types
on appropriate HTML/assets/error responses. No deployment
configuration is present in this repository, so deployed header coverage is
pending until the hosting platform is known.

Obtain the preview/production policy values using Node from the repository root:

```powershell
node --input-type=module -e "import { frontendCsp } from './security/frontendCsp.mjs'; console.log(frontendCsp({application:'client'}))"
node --input-type=module -e "import { frontendCsp } from './security/frontendCsp.mjs'; console.log(frontendCsp({application:'admin'}))"
```

When deploying, align API source URLs and CSP connect-src with the actual backend
origin; current admin code contains direct localhost:8001 calls. Keep external
script origins specific. Z5 removed the Google Fonts CSP allowances after
self-hosting Poppins. Validate headers and browser flows
again at the actual deployed URL.

## Frame protection checks (SE4030 Z4)

```powershell
node security/tests/frame-protection-checks.mjs
node security/tests/frame-protection-checks.mjs --preview
```

Add `--browser` with `Z2_PLAYWRIGHT_MODULE` configured to check actual Chromium
frame refusal and top-level login rendering. The tests use local fixture
parents; the same-origin parent is fulfilled in the browser without the app's
own frame-src restriction so that the child frame-ancestors rule is tested
directly. A separate, explicitly labeled browser-only check strips CSP from
the framed response to verify X-Frame-Options independently. Normal application
responses keep both headers. The browser tests produce real screenshots under
the Z4 evidence directory and do not log in or use accounts/cookies/database.

## Font integrity (SE4030 Z5)

Both apps serve Poppins from `public/fonts/poppins/`. Each copy contains all
54 WOFF2 files requested by the original Google Fonts stylesheet: weights
100 through 900, normal/italic, and Devanagari/Latin extended/Latin subsets.
The font bytes and Unicode ranges are preserved. `OFL.txt` contains the actual
SIL Open Font License; `provenance.json` records upstream URLs and SHA-384
digests of the downloaded font files, stylesheet and license.

Both HTML entry points load `/fonts/poppins/poppins.css` with its actual
`sha384-...` integrity value and `crossorigin="anonymous"`. The former external
stylesheet reference is disabled in a comment for assessment evidence. Google
Fonts preconnects and CSP allowances were removed. Google Identity Services
script/style/frame permissions remain separate; the dynamic GIS script was
not the resource named in the original SRI alert and was not copied or given
an invented hash.

The maintenance script `vendor-poppins.mjs` is not a build/runtime dependency.
It uses the captured Google Fonts CSS under Z5 evidence and downloads only the
public Poppins font files and OFL license when explicitly run for an authorized
update. It verifies WOFF2 headers/lengths and refuses to overwrite existing
assets. Updates require review of the asset diff and a freshly computed HTML
integrity value; no network font download happens during application startup
or builds.

`.gitattributes` pins these text files to LF and font files to binary so checkout
conversion cannot invalidate the recorded digests. Serve the CSS and font
assets unchanged in deployment; transformations of the pinned CSS require a
corresponding integrity update.

```powershell
node security/tests/external-resource-checks.mjs
node security/tests/font-assets-checks.mjs
npm.cmd --prefix client run build
npm.cmd --prefix admin run build
node security/tests/font-assets-checks.mjs --preview
```

The font suite verifies local/served SHA-384 bytes and all HTML integrity values.
Add `--browser` with `Z2_PLAYWRIGHT_MODULE` configured to verify all 54 font/style/
subset loads in Chromium, no external Google Fonts requests/CSP violations, and
normal login rendering. It saves real screenshots with an explicitly appended
font specimen under Z5 evidence; the specimen is test-only UI, not application
code or a ZAP result.

To recompute the exact stylesheet SRI from the repository root:

```powershell
node --input-type=module -e "import { createHash } from 'node:crypto'; import { readFileSync } from 'node:fs'; console.log('sha384-'+createHash('sha384').update(readFileSync('client/public/fonts/poppins/poppins.css')).digest('base64'))"
```

## MIME handling (SE4030 Z6)

`noSniffHeaders.mjs` installs an early Vite middleware in development and preview
so HTML, assets, missing URLs and early middleware responses carry
`X-Content-Type-Options: nosniff`. Static-response header configuration alone
would not cover every error or short-circuit response. Express's dedicated
Helmet xContentTypeOptions middleware runs before parsers and CORS; the full
existing Helmet configuration remains in place for its other controls.

```powershell
node security/tests/nosniff-checks.mjs
node security/tests/nosniff-checks.mjs --preview
```

These inspect actual response headers and expected MIME types on HTML,
JavaScript, CSS, SVG, WOFF2, license text, missing assets, a test-only early 500
fixture, API authentication/404/JSON-parse errors and credentialed preflights.
The fixture exists only in the test's Vite configuration, not the application.
HTTP-only test servers disable speculative pre-transforms to avoid background
work during short-lived server teardown. Normal app optimization is unchanged.
