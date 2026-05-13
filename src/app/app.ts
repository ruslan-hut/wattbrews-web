import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { PwaService } from './core/services/pwa.service';
import { InstallPromptService } from './core/services/install-prompt.service';
import { OfflineService } from './core/services/offline.service';
import { NotificationService } from './core/services/notification.service';

const FULLSCREEN_ROUTE_PREFIXES = ['/welcome', '/legal'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainLayoutComponent],
  template: `
    @if (isFullscreenRoute()) {
      <router-outlet></router-outlet>
    } @else {
      <app-main-layout>
        <router-outlet></router-outlet>
      </app-main-layout>
    }
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly pwaService = inject(PwaService);
  private readonly installPromptService = inject(InstallPromptService);
  private readonly offlineService = inject(OfflineService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly title = signal('WattBrews');
  protected readonly isFullscreenRoute = signal(this.matchesFullscreen(this.router.url));

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => this.isFullscreenRoute.set(this.matchesFullscreen(event.urlAfterRedirects)));

    this.initializePwa();
    this.initializeOfflineMonitoring();
  }

  private matchesFullscreen(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return FULLSCREEN_ROUTE_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
  }

  ngOnDestroy(): void {
    // Services handle their own cleanup
  }

  /**
   * Initialize PWA features
   */
  private initializePwa(): void {
    // PwaService initializes automatically in constructor
    // InstallPromptService initializes automatically in constructor
    
    // Check for service worker registration errors
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('error', (event) => {
        console.error('Service Worker error:', event);
        this.notificationService.error(
          'Service Worker error occurred. Some features may not work properly.',
          'PWA Error'
        );
      });
    }
  }

  /**
   * Initialize offline monitoring
   */
  private initializeOfflineMonitoring(): void {
    // Subscribe to connection status changes
    this.offlineService.getConnectionStatus().subscribe(isOnline => {
      if (!isOnline) {
        this.notificationService.warning(
          'You are currently offline. Some features may not be available.',
          'Offline Mode'
        );
      }
    });
  }
}
