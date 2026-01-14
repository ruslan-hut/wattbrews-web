import { Injectable, signal, computed } from '@angular/core';
import { Observable, MonoTypeOperatorFunction } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * Loading context identifiers for different operations.
 * Each context tracks its own loading state independently.
 */
export type LoadingContext =
  | 'chargePoints'
  | 'transactions'
  | 'activeTransactions'
  | 'userInfo'
  | 'auth'
  | 'stationDetail'
  | 'sessionHistory'
  | 'global';

/**
 * Centralized loading state management service.
 * Tracks loading states across different contexts/operations.
 *
 * Usage:
 * ```typescript
 * // In service
 * loadData(): Observable<Data> {
 *   return this.apiService.get<Data>(endpoint).pipe(
 *     this.loadingStateService.withLoading('chargePoints')
 *   );
 * }
 *
 * // In component template
 * @if (loadingStateService.isLoading()) {
 *   <app-loading-spinner />
 * }
 *
 * // Check specific context
 * @if (loadingStateService.isContextLoading('chargePoints')) {
 *   <app-loading-spinner message="Loading stations..." />
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingStateService {
  /** Set of currently active loading contexts */
  private readonly _loadingContexts = signal<Set<LoadingContext>>(new Set());

  /** Read-only signal of loading contexts */
  readonly loadingContexts = this._loadingContexts.asReadonly();

  /** Computed signal: true if any loading is active */
  readonly isLoading = computed(() => this._loadingContexts().size > 0);

  /** Computed signal: count of active loading operations */
  readonly loadingCount = computed(() => this._loadingContexts().size);

  /**
   * Start loading for a specific context
   */
  start(context: LoadingContext): void {
    this._loadingContexts.update(set => {
      const newSet = new Set(set);
      newSet.add(context);
      return newSet;
    });
  }

  /**
   * Stop loading for a specific context
   */
  stop(context: LoadingContext): void {
    this._loadingContexts.update(set => {
      const newSet = new Set(set);
      newSet.delete(context);
      return newSet;
    });
  }

  /**
   * Check if a specific context is loading
   */
  isContextLoading(context: LoadingContext): boolean {
    return this._loadingContexts().has(context);
  }

  /**
   * Create a computed signal for a specific context's loading state.
   * Useful for binding to component properties.
   */
  contextLoading(context: LoadingContext) {
    return computed(() => this._loadingContexts().has(context));
  }

  /**
   * Clear all loading states.
   * Use sparingly - typically for error recovery or cleanup.
   */
  clearAll(): void {
    this._loadingContexts.set(new Set());
  }

  /**
   * RxJS operator that automatically manages loading state.
   * Starts loading when subscribed, stops when complete or on error.
   *
   * @param context - The loading context to track
   * @returns RxJS operator function
   *
   * @example
   * ```typescript
   * this.apiService.get('/data').pipe(
   *   this.loadingStateService.withLoading('chargePoints')
   * );
   * ```
   */
  withLoading<T>(context: LoadingContext): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) => {
      return new Observable<T>(subscriber => {
        // Start loading immediately on subscription
        this.start(context);

        return source.pipe(
          finalize(() => {
            // Stop loading on complete, error, or unsubscribe
            this.stop(context);
          })
        ).subscribe(subscriber);
      });
    };
  }

  /**
   * Execute an async function with loading state management.
   * Useful for async/await patterns.
   *
   * @param context - The loading context to track
   * @param fn - Async function to execute
   * @returns Promise result of the function
   *
   * @example
   * ```typescript
   * const data = await this.loadingStateService.withLoadingAsync(
   *   'auth',
   *   () => this.authService.signIn(email, password)
   * );
   * ```
   */
  async withLoadingAsync<T>(
    context: LoadingContext,
    fn: () => Promise<T>
  ): Promise<T> {
    this.start(context);
    try {
      return await fn();
    } finally {
      this.stop(context);
    }
  }

  /**
   * Get active loading contexts as an array (for debugging)
   */
  getActiveContexts(): LoadingContext[] {
    return Array.from(this._loadingContexts());
  }
}
