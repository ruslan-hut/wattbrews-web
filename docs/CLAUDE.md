# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WattBrews is a modern Angular 20 web application for managing electric vehicle charging infrastructure. It provides real-time monitoring of charge points, transaction management, and user-friendly interfaces using Firebase Authentication, WebSocket connections, and Material Design 3.

## Essential Commands

### Development
```bash
# Start development server (automatically runs config:dev first)
npm start

# Start on specific port
ng serve --port 4300

# Generate environment files from .env
npm run config:dev

# Verify environment setup
npm run verify:env
```

### Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode (CI)
ng test --browsers=ChromeHeadless --watch=false
```

### Building
```bash
# Production build (automatically runs prebuild script)
npm run build

# Watch mode for development
npm run watch
```

### Code Quality
```bash
# Format code with Prettier
npx prettier --write .

# Lint TypeScript files
ng lint
```

### Code Generation
```bash
# Generate component in features
ng generate component features/my-feature

# Generate service in core/services
ng generate service core/services/my-service

# Generate guard
ng generate guard core/guards/my-guard
```

## Architecture Overview

### Application Structure

**Standalone Components**: The entire app uses standalone components (no NgModules). The `standalone: true` property is default and must NOT be explicitly set.

**Routing**: Lazy-loaded feature modules using functional route guards. All routes defined in `app.routes.ts` with lazy loading via `loadChildren()`.

**State Management**: Signal-based reactive state management throughout. Services expose readonly signals and computed values.

### Core Services Architecture

**Singleton Services** (`providedIn: 'root'`):
- **ApiService**: HTTP client wrapper with automatic retry logic (3 retries with exponential backoff) for network errors and 5xx responses
- **AuthService**: Firebase authentication with signal-based state (user, isAuthenticated, userProfile). Uses both signals and BehaviorSubject for backwards compatibility
- **WebSocketService**: Global WebSocket connection manager with automatic reconnection, exponential backoff, and token-aware messaging
- **SimpleTranslationService**: Internationalization service supporting English/Spanish with reactive translation updates
- **ChargePointService** & **TransactionService**: Domain-specific services using signals for state management
- **StateService**: Application-level state management with signals
- **StorageService**: LocalStorage wrapper for persisting user preferences and offline data
- **NotificationService**: Angular Material snackbar-based notifications

### HTTP Architecture

**Base URL**: Configured via `environment.apiBaseUrl` (default: `https://wattbrews.me/api/v1`)

**Interceptors** (applied in order):
1. `firebaseAuthInterceptor`: Adds `Authorization: Bearer <token>` header to all requests except `/auth/` and `/public/` endpoints
2. `httpErrorInterceptor`: Centralized error handling with user-friendly notifications

**Error Handling**: ApiService implements retry logic for network failures (status 0) and server errors (5xx). Client errors (4xx) are not retried.

### WebSocket Architecture

**Global Connection Strategy**: Single persistent WebSocket connection established at app startup and maintained throughout application lifecycle.

**Connection Management**:
- Automatic reconnection with exponential backoff (starting at 1s, max 30s)
- Browser visibility awareness (pauses ping when tab hidden)
- Token-aware: Checks authentication before sending commands
- Auto-recovery from network issues

**Usage Pattern**: Components subscribe to message streams via `filterMessages()` or `connectionState()`. They do NOT manage connections directly.

**Base URL**: Configured via `environment.wsBaseUrl` (default: `wss://wattbrews.me/ws`)

See `WEBSOCKET_TECHNICAL_GUIDE.md` for detailed integration instructions.

### State Management Patterns

**Signals Pattern** (use everywhere):
```typescript
// Private writable signal
private readonly _data = signal<Data | null>(null);

// Public readonly signal
readonly data = this._data.asReadonly();

// Computed values
readonly isDataLoaded = computed(() => !!this._data());
```

**NEVER use** `mutate()` on signals. Always use `set()` or `update()`.

### Authentication & Authorization

**Firebase Auth**: Email/password authentication with email verification and password reset.

**User Profile Storage**: Firestore collection `users/{uid}` stores extended profile data (firstName, lastName, role, etc.).

**Role-Based Access**: `role.guard.ts` protects admin routes. User roles stored in Firestore user document.

**Token Flow**:
1. User authenticates via Firebase Auth
2. `firebaseAuthInterceptor` adds token to all API requests
3. Backend validates token and authorizes requests

### Translation/i18n

**Implementation**: Custom `SimpleTranslationService` (NOT ngx-translate).

**Supported Languages**: English (en), Spanish (es)

**Translation Files**: `public/assets/i18n/{lang}.json`

**Usage**: Services expose `t$()` observable for reactive translations and `t()` for synchronous translations.

See `TRANSLATION_SERVICE_TECHNICAL_GUIDE.md` for implementation details.

### Design System

**Theme**: Energy/Electric theme with Material Design 3

**Colors**:
- Primary: Cyan (`mat.$cyan-palette`) - Electric blue
- Secondary: Amber (`mat.$yellow-palette`) - Energy yellow
- Tertiary: Blue (`mat.$blue-palette`) - Technology blue

**Custom CSS Properties** available globally:
- `--energy-cyan`, `--energy-cyan-light`, `--energy-cyan-dark`
- `--energy-amber`, `--energy-amber-light`, `--energy-amber-dark`
- `--energy-blue`, `--energy-blue-light`, `--energy-blue-dark`
- Gray scale: `--energy-gray-50` through `--energy-gray-900`

See `DESIGN_POLICY.md` and `DESIGN_EXAMPLES.md` for complete design guidelines.

## Critical Development Rules

These rules are enforced via `.cursor/rules/cursor.mdc` and MUST be followed:

### Angular & TypeScript

- **Standalone components only** - No NgModules
- **NEVER set `standalone: true`** - It's the default
- **Use signals for state management** - Not RxJS BehaviorSubject (except for backwards compatibility)
- **Always use OnPush change detection**: `changeDetection: ChangeDetectionStrategy.OnPush`
- **Use `inject()` function** instead of constructor injection
- **Use `input()` and `output()`** functions instead of `@Input()` and `@Output()` decorators
- **NEVER use `@HostBinding` or `@HostListener`** - Use `host` object in decorator instead
- **Use computed() for derived state** - Not manual calculations in templates

### Templates & Control Flow

- **Use native control flow**: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitch`)
- **NO `ngClass`** - Use `[class.className]` bindings instead
- **NO `ngStyle`** - Use `[style.property]` bindings instead
- **Keep templates simple** - Complex logic belongs in component
- **Use async pipe** for observables in templates
- **Always separate** component into TypeScript, HTML, and SCSS files (no inline templates)

### Forms & Images

- **Prefer Reactive Forms** over template-driven forms
- **Use `NgOptimizedImage`** for all static images (does NOT work for base64 inline images)

### Code Organization

- **Small, focused components** - Single responsibility principle
- **Services with `providedIn: 'root'`** for singletons
- **Lazy loading** for all feature routes
- **Strict TypeScript** - Avoid `any`, use `unknown` when type uncertain

## Environment Configuration

**Configuration Files**: NEVER commit generated environment files. They are auto-generated from `.env`.

**Setup Process**:
1. `cp env.example .env`
2. Edit `.env` with Firebase credentials
3. `npm run config:dev` (or just `npm start` - it runs automatically)
4. `npm run verify:env` to verify setup

**Required Environment Variables**:
- `FIREBASE_API_KEY` - Get from Firebase Console
- `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, etc.
- `API_BASE_URL` - Backend API URL
- `WS_BASE_URL` - WebSocket URL

See `SETUP_LOCAL_DEV.md` for detailed setup instructions.

## Testing Conventions

**Test Framework**: Jasmine with Karma

**File Naming**: `*.spec.ts` files co-located with source files

**Coverage**: Run `ng test --code-coverage` to generate coverage report

## PWA Configuration

**Service Worker**: Enabled in production builds via `ngsw-config.json`

**Installation**: `InstallPromptService` and `PwaService` manage PWA install prompts

**Offline Support**: `OfflineService` handles offline state and provides cached data

## Key Documentation Files

- `DEPLOYMENT.md` - Deployment and CI/CD setup
- `WEBSOCKET_TECHNICAL_GUIDE.md` - WebSocket integration guide
- `WEBSOCKET_DESCRIPTION.md` - Backend WebSocket API spec
- `TRANSLATION_SERVICE_TECHNICAL_GUIDE.md` - i18n implementation
- `DESIGN_POLICY.md` - Design system guidelines
- `DESIGN_EXAMPLES.md` - Practical design examples
