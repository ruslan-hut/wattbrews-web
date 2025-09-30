import { Injectable, signal, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  timestamp: Date;
}

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
  verticalPosition?: 'top' | 'bottom';
  horizontalPosition?: 'start' | 'center' | 'end';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // Signal for notifications state
  private readonly _notifications = signal<Notification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  /**
   * Show success notification
   */
  success(message: string, title?: string, options?: NotificationOptions): void {
    this.showNotification({
      type: 'success',
      title: title || 'Success',
      message,
      ...options
    });
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string, options?: NotificationOptions): void {
    this.showNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration: options?.duration || 5000,
      ...options
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string, options?: NotificationOptions): void {
    this.showNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      ...options
    });
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string, options?: NotificationOptions): void {
    this.showNotification({
      type: 'info',
      title: title || 'Info',
      message,
      ...options
    });
  }

  /**
   * Show charging session started notification
   */
  chargingStarted(sessionId: string, stationName: string): void {
    this.success(
      `Charging started at ${stationName}`,
      'Charging Session',
      {
        duration: 3000,
        action: {
          label: 'View',
          callback: () => {
            // Navigate to session detail
            console.log('Navigate to session:', sessionId);
          }
        }
      }
    );
  }

  /**
   * Show charging session completed notification
   */
  chargingCompleted(sessionId: string, energyDelivered: number, cost: number): void {
    this.success(
      `Charging completed! Energy: ${energyDelivered.toFixed(2)} kWh, Cost: €${(cost / 100).toFixed(2)}`,
      'Charging Complete',
      {
        duration: 5000,
        action: {
          label: 'View Details',
          callback: () => {
            // Navigate to session detail
            console.log('Navigate to session:', sessionId);
          }
        }
      }
    );
  }

  /**
   * Show charging session stopped notification
   */
  chargingStopped(sessionId: string): void {
    this.info(
      'Charging session stopped',
      'Session Stopped',
      {
        duration: 3000
      }
    );
  }

  /**
   * Show station added to favorites notification
   */
  stationAddedToFavorites(stationName: string): void {
    this.success(
      `${stationName} added to favorites`,
      'Favorite Added'
    );
  }

  /**
   * Show station removed from favorites notification
   */
  stationRemovedFromFavorites(stationName: string): void {
    this.info(
      `${stationName} removed from favorites`,
      'Favorite Removed'
    );
  }

  /**
   * Show payment successful notification
   */
  paymentSuccessful(amount: number): void {
    this.success(
      `Payment of €${(amount / 100).toFixed(2)} processed successfully`,
      'Payment Complete'
    );
  }

  /**
   * Show payment failed notification
   */
  paymentFailed(error: string): void {
    this.error(
      `Payment failed: ${error}`,
      'Payment Error',
      {
        duration: 7000
      }
    );
  }

  /**
   * Show low battery warning
   */
  lowBatteryWarning(batteryLevel: number): void {
    this.warning(
      `Battery level is at ${batteryLevel}%. Consider charging soon.`,
      'Low Battery',
      {
        duration: 8000
      }
    );
  }

  /**
   * Show station maintenance notification
   */
  stationMaintenance(stationName: string): void {
    this.warning(
      `${stationName} is under maintenance. Please use an alternative station.`,
      'Station Maintenance',
      {
        duration: 10000
      }
    );
  }

  /**
   * Show network error notification
   */
  networkError(): void {
    this.error(
      'Network connection lost. Some features may not work properly.',
      'Connection Error',
      {
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Retry',
          callback: () => {
            // Retry logic
            window.location.reload();
          }
        }
      }
    );
  }

  /**
   * Show generic notification
   */
  private showNotification(options: NotificationOptions & {
    type: Notification['type'];
    title: string;
    message: string;
  }): void {
    const notification: Notification = {
      id: this.generateId(),
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration || 4000,
      action: options.action,
      timestamp: new Date()
    };

    // Add to notifications array
    this._notifications.update(notifications => [...notifications, notification]);

    // Show snackbar
    const snackBarConfig: MatSnackBarConfig = {
      duration: notification.duration,
      verticalPosition: options.verticalPosition || 'bottom',
      horizontalPosition: options.horizontalPosition || 'center',
      panelClass: [`notification-${notification.type}`]
    };

    const snackBarRef = this.snackBar.open(
      notification.message,
      notification.action?.label,
      snackBarConfig
    );

    // Handle action click
    if (notification.action) {
      snackBarRef.onAction().subscribe(() => {
        notification.action!.callback();
      });
    }

    // Auto-remove from notifications array
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Remove notification by ID
   */
  removeNotification(id: string): void {
    this._notifications.update(notifications => 
      notifications.filter(n => n.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this._notifications.set([]);
    this.snackBar.dismiss();
  }

  /**
   * Show confirmation dialog
   */
  async confirm(
    title: string, 
    message: string, 
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): Promise<boolean> {
    // This would typically use MatDialog to show a confirmation dialog
    // For now, we'll use the browser's confirm dialog
    return confirm(`${title}\n\n${message}`);
  }

  /**
   * Show loading notification
   */
  showLoading(message: string = 'Loading...'): void {
    this.snackBar.open(message, '', {
      duration: 0, // Don't auto-dismiss
      panelClass: ['notification-loading']
    });
  }

  /**
   * Hide loading notification
   */
  hideLoading(): void {
    this.snackBar.dismiss();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
