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
