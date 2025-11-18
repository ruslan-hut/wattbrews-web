import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly notificationService = inject(NotificationService);

  // Signal to track if an update is available
  readonly updateAvailable = signal<boolean>(false);
  
  // Signal to track if update is being activated
  readonly isActivating = signal<boolean>(false);

  constructor() {
    // Only initialize if service worker is enabled
    if (this.swUpdate.isEnabled) {
      this.initializeUpdateCheck();
    }
  }

  /**
   * Initialize service worker update checking
   */
  private initializeUpdateCheck(): void {
    // Check for updates on initialization
    this.checkForUpdates();

    // Listen for version updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(() => {
        this.updateAvailable.set(true);
        this.notifyUpdateAvailable();
      });

    // Handle unrecoverable state
    this.swUpdate.unrecoverable.subscribe(() => {
      this.notificationService.error(
        'An error occurred that the service worker cannot recover from. The page will reload.',
        'Service Worker Error',
        {
          duration: 0,
          action: {
            label: 'Reload',
            callback: () => {
              window.location.reload();
            }
          }
        }
      );
    });
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      const updateAvailable = await this.swUpdate.checkForUpdate();
      if (updateAvailable) {
        this.updateAvailable.set(true);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  /**
   * Activate the available update and reload the page
   */
  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled || !this.updateAvailable()) {
      return;
    }

    try {
      this.isActivating.set(true);
      await this.swUpdate.activateUpdate();
      
      // Reload the page to apply the update
      window.location.reload();
    } catch (error) {
      console.error('Error activating update:', error);
      this.notificationService.error(
        'Failed to activate update. Please refresh the page manually.',
        'Update Error'
      );
      this.isActivating.set(false);
    }
  }

  /**
   * Notify user about available update
   */
  private notifyUpdateAvailable(): void {
    this.notificationService.info(
      'A new version of the app is available.',
      'Update Available',
      {
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Update',
          callback: () => {
            this.activateUpdate();
          }
        }
      }
    );
  }
}

