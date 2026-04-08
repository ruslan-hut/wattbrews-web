# Architecture

High-level map of how the app is wired. Deep dives for individual subsystems live in their own docs (WebSocket, Translation, Design).

## Layers

- **`core/`** — singletons only: `services/`, `guards/`, `interceptors/`, `handlers/`, `models/`, `constants/`.
- **`features/`** — user-facing bundles (`auth`, `dashboard`, `stations`, `sessions`, `profile`, `tools`), each lazy-loaded with its own `*.routes.ts`.
- **`layouts/`** — `auth-layout` and `main-layout` shells.
- **`shared/`** — reusable components, pipes, utils, models; re-exported via `shared/index.ts`.

## Routing

`src/app/app.routes.ts` is the only top-level route table. `/` redirects to `/dashboard`; wildcard redirects to `/dashboard`. Every feature is loaded via `loadChildren()`. Admin routes are protected by `role.guard.ts`, which reads the user's role from the Firestore `users/{uid}` document.

## Core services (all `providedIn: 'root'`)

| Service | Role |
|---|---|
| `ApiService` | `HttpClient` wrapper. Retries network errors (status 0) and 5xx with exponential backoff, 3 attempts. Does **not** retry 4xx. |
| `AuthService` | Firebase Auth. Exposes signals `user`, `isAuthenticated`, `userProfile`, plus a legacy `BehaviorSubject` for backwards compatibility. |
| `WebSocketService` | Single global socket — see below and `WEBSOCKET_TECHNICAL_GUIDE.md`. |
| `SimpleTranslationService` | Custom i18n (not ngx-translate, despite the package being installed). See `TRANSLATION_SERVICE_TECHNICAL_GUIDE.md`. |
| `ThemeService` | Toggles `data-theme="dark"` on the root element; persists to localStorage; respects system preference on first load. |
| `ChargePointService`, `TransactionService` | Domain state stores exposing readonly signals. |
| `StateService` | App-level shared state. |
| `StorageService` | `localStorage` wrapper for prefs and offline data. |
| `NotificationService` | Material snackbar notifications. |

## HTTP

- **Base URL**: `environment.apiBaseUrl` (default `https://wattbrews.me/api/v1`).
- **Interceptors run in this order**:
  1. `firebaseAuthInterceptor` — attaches `Authorization: Bearer <firebase-id-token>` to every request **except** `/auth/` and `/public/` paths.
  2. `httpErrorInterceptor` — centralises error surfacing via `NotificationService`.
- **Retry policy** lives in `ApiService`, not in interceptors: 3 retries with exponential backoff for status 0 and 5xx only.

## WebSocket (summary)

One persistent connection opened at app startup and kept alive for the whole session. Exponential reconnect (1 s → 30 s cap), tab-visibility-aware pings, token-aware send. **Components must not open or close the socket themselves** — they subscribe via `filterMessages()` or `connectionState()`. Base URL from `environment.wsBaseUrl`. Full protocol and integration notes: `WEBSOCKET_TECHNICAL_GUIDE.md`; backend spec: `WEBSOCKET_DESCRIPTION.md`.

## Authentication flow

1. User signs in via Firebase Auth (email/password, with verification + reset).
2. Extended profile (firstName, lastName, role, …) is read from Firestore `users/{uid}`.
3. `firebaseAuthInterceptor` injects the ID token on outgoing API calls.
4. Backend verifies the token and authorises the request; `role.guard.ts` gates admin routes on the client.

## State management pattern

```typescript
// private writable
private readonly _data = signal<Data | null>(null);

// public readonly
readonly data = this._data.asReadonly();

// derived
readonly isLoaded = computed(() => this._data() !== null);
```

Never call `mutate()`. Use `set()` or `update()`. `computed()` for anything derived. Services expose readonly signals, not the writable ones.

## PWA

Service worker is enabled in production via `ngsw-config.json`. `PwaService` and `InstallPromptService` drive install prompts; app updates surface through a **dialog** (not a snackbar) with "Update Now" / "Later" actions. `OfflineService` manages offline state and cached data.
