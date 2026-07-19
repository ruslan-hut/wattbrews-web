# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Angular 21 + Material 21 standalone-component app for managing EV charging infrastructure. Firebase Auth, one global WebSocket for live updates, Leaflet maps, ECharts, custom i18n, PWA.

## Topic index

Read the relevant topic file before making changes in that area.

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — layers, routing, core services, HTTP/interceptors, auth flow, signal state pattern, PWA.
- **[docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)** — Angular/template/style rules enforced in review.
- **[docs/DESIGN_POLICY.md](docs/DESIGN_POLICY.md)** — colors, typography, spacing, radii, Material overrides.
- **[docs/WEBSOCKET_TECHNICAL_GUIDE.md](docs/WEBSOCKET_TECHNICAL_GUIDE.md)** — WebSocket integration.
- **[docs/TRANSLATION_SERVICE_TECHNICAL_GUIDE.md](docs/TRANSLATION_SERVICE_TECHNICAL_GUIDE.md)** — custom `SimpleTranslationService`.
- **[docs/SETUP_LOCAL_DEV.md](docs/SETUP_LOCAL_DEV.md)** — local env setup.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — deployment / CI.

## Linked Projects

| Repository | Local path | Role |
|---|---|---|
| evsys-back | `~/projects/evsys-back` | The API and WebSocket server this app calls (Go, Chi v5, MongoDB) |
| evsys | `~/projects/evsys` | OCPP central system; writes the charge point and transaction data the API serves |
| Wattbrews | `~/projects/Wattbrews` | Android app on the same API |
| evsys-front | `~/projects/evsys-front` | Angular web app (operator/admin) on the same API |

This app is one of three clients of evsys-back. Data flows
evsys → MongoDB → evsys-back → here, and the models are hand-copied at each
hop, so a value that renders empty may never have been carried through rather
than being a bug here. Check that `~/projects/evsys-back/entity/` declares the
field and that the endpoint returns it — the transaction detail endpoint
returns the `ChargeState` DTO, not the full transaction.

The Android client ships through the Play Store and old versions stay in use,
so evsys-back changes response shapes only additively. A field this app needs
must be **added** to the API, never reshaped — see
`~/projects/evsys-back/CLAUDE.md`.

## Commands

```bash
npm start            # prestart runs scripts/set-env.js, then `ng serve`
npm run build        # prebuild runs scripts/set-env.js --prod, then `ng build`
npm run watch        # dev build in watch mode
npm test             # karma + jasmine
ng test --code-coverage
ng test --browsers=ChromeHeadless --watch=false   # single-run (CI)
ng lint
npx prettier --write .

npm run config:dev   # regenerate src/environments/*.ts from .env
npm run verify:env
npm run show:secrets # values formatted for GitHub Actions secrets
```

Run a single spec with `ng test --include='**/path/to/file.spec.ts'`. No e2e runner is configured.

## Environment files are generated — never edit or commit them

`src/environments/environment.ts` and `environment.development.ts` are produced by `scripts/set-env.js` from a root `.env` (template in `env.example`). `prestart` and `prebuild` invoke it automatically, so `npm start` / `npm run build` work from a fresh clone once `.env` exists. Required keys: `FIREBASE_API_KEY` (plus the other `FIREBASE_*` fields), `API_BASE_URL`, `WS_BASE_URL`. See `docs/SETUP_LOCAL_DEV.md`.

## Essentials to remember before touching code

- Standalone components only — do **not** set `standalone: true` (default in Angular 21). `OnPush` everywhere. `inject()`, `input()`, `output()`. Native control flow (`@if` / `@for` / `@switch`). Signals for state — never `mutate()`. Full list in `docs/CODING_STANDARDS.md`.
- **Do not open WebSocket connections from components** — subscribe to `WebSocketService` streams. See `docs/ARCHITECTURE.md`.
- **Never hardcode colors, spacing, radii, or fonts** — use the CSS custom properties from `docs/DESIGN_POLICY.md`. Global Material overrides live in `src/styles.scss`.
- i18n uses the custom `SimpleTranslationService` (not ngx-translate, even though the package is installed). In templates: `translationService.getReactive('key.path')`.

## Prettier

Configured inline in `package.json`: `printWidth: 100`, `singleQuote: true`, HTML parsed as `angular`.
