import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { PwaService } from './core/services/pwa.service';
import { InstallPromptService } from './core/services/install-prompt.service';
import { OfflineService } from './core/services/offline.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainLayoutComponent],
  template: `
    <app-main-layout>
      <router-outlet></router-outlet>
    </app-main-layout>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly pwaService = inject(PwaService);
  private readonly installPromptService = inject(InstallPromptService);
  private readonly offlineService = inject(OfflineService);
  private readonly notificationService = inject(NotificationService);

  protected readonly title = signal('WattBrews');

  ngOnInit(): void {
    this.initializePwa();
    this.initializeOfflineMonitoring();
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
