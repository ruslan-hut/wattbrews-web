import { Injectable, signal, inject } from '@angular/core';
import { Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  // Signal to track online/offline status
  readonly isOnline = signal<boolean>(navigator.onLine);

  // Observable for connection status changes
  readonly connectionStatus$: Observable<boolean>;

  constructor() {
    // Create observable from online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    this.connectionStatus$ = merge(online$, offline$).pipe(
      startWith(navigator.onLine),
      map(isOnline => {
        this.isOnline.set(isOnline);
        return isOnline;
      })
    );

    // Subscribe to update signal
    this.connectionStatus$.subscribe();
  }

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline();
  }

  /**
   * Get connection status as observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$;
  }
}

