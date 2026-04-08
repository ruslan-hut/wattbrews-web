# Coding Standards

Hard rules for this codebase. Enforced in review.

## Angular & TypeScript

- **Standalone components only** — no NgModules. Do **not** set `standalone: true`; it is the default in Angular 21.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **`inject()`** for DI — not constructor injection.
- **`input()` / `output()`** functions — not `@Input()` / `@Output()` decorators.
- **Never** `@HostBinding` / `@HostListener` — use the `host` object in the decorator.
- **`computed()`** for derived state; don't compute in templates.
- **Signals** for state. Never call `mutate()` — use `set()` / `update()`. RxJS `BehaviorSubject` is only acceptable as a backwards-compatibility shim alongside a signal (see `AuthService`).
- **Strict TypeScript** — avoid `any`; use `unknown` when the type is uncertain.

## Templates & control flow

- **Native control flow only**: `@if` / `@for` / `@switch`. Never `*ngIf` / `*ngFor` / `*ngSwitch`.
- **No `ngClass`** — use `[class.name]` bindings.
- **No `ngStyle`** — use `[style.prop]` bindings.
- **Async pipe** for observables in templates.
- **Always split** components into separate `.ts` / `.html` / `.scss` files. No inline templates or styles.
- Keep templates simple; complex logic belongs in the component.

## Styling

- **Always use CSS variables** from the design system. No hardcoded colors, sizes, or radii. See `docs/DESIGN_POLICY.md` for the token catalogue.
- `--font-family-display` for headings and titles.
- `--font-family-body` for body text, buttons, labels, form fields.
- **Global Material component overrides** live in `src/styles.scss` — component SCSS should use tokens, not raw values.

## Forms & images

- **Reactive forms** preferred over template-driven.
- **`NgOptimizedImage`** for static images (does not work for inline base64).

## Code organization

- **Small, focused components** — single responsibility.
- **Singleton services** use `providedIn: 'root'`.
- **Lazy loading** for every feature route (`loadChildren()` in `app.routes.ts` and per-feature `*.routes.ts`).
