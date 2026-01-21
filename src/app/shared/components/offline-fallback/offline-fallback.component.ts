import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OfflineService } from '../../../core/services/offline.service';

@Component({
  selector: 'app-offline-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
],
  template: `
    <div class="offline-container">
      <mat-card class="offline-card">
        <mat-card-content>
          <div class="offline-content">
            <mat-icon class="offline-icon">cloud_off</mat-icon>
            <h2>You're Offline</h2>
            <p>It looks like you've lost your internet connection. Some features may not be available.</p>
            <div class="offline-actions">
              <button 
                mat-raised-button 
                color="primary" 
                (click)="retry()"
                [disabled]="!offlineService.isOnline()">
                <mat-icon>refresh</mat-icon>
                Retry Connection
              </button>
            </div>
            <div class="connection-status" [class.online]="offlineService.isOnline()">
              <mat-icon>{{ offlineService.isOnline() ? 'wifi' : 'wifi_off' }}</mat-icon>
              <span>{{ offlineService.isOnline() ? 'Connected' : 'Disconnected' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .offline-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
      background: var(--energy-background);
    }

    .offline-card {
      max-width: 500px;
      width: 100%;
      background: var(--energy-surface);
      border-radius: var(--energy-radius-xl);
    }

    .offline-content {
      text-align: center;
      padding: 2rem;
    }

    .offline-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--energy-text-muted);
      margin-bottom: 1rem;
    }

    h2 {
      margin: 1rem 0;
      color: var(--energy-text-primary);
    }

    p {
      color: var(--energy-text-secondary);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .offline-actions {
      margin: 2rem 0;
    }

    .offline-actions button {
      margin: 0.5rem;
    }

    .connection-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding: 0.75rem;
      border-radius: var(--energy-radius-md);
      background: var(--energy-surface-variant);
      color: var(--energy-text-secondary);
    }

    .connection-status.online {
      background: var(--energy-success);
      color: white;
    }

    .connection-status mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class OfflineFallbackComponent {
  readonly offlineService = inject(OfflineService);

  retry(): void {
    if (this.offlineService.isOnline()) {
      window.location.reload();
    }
  }
}

