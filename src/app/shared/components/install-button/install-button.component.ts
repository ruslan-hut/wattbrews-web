import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InstallPromptService } from '../../../core/services/install-prompt.service';

@Component({
  selector: 'app-install-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    @if (shouldShow()) {
      <button 
        mat-raised-button 
        color="primary"
        (click)="handleInstall()"
        [disabled]="isInstalling()">
        <mat-icon>{{ isInstalling() ? 'hourglass_empty' : 'get_app' }}</mat-icon>
        {{ isInstalling() ? 'Installing...' : 'Install App' }}
      </button>
    }
  `,
  styles: [`
    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `]
})
export class InstallButtonComponent {
  private readonly installPromptService = inject(InstallPromptService);

  readonly isInstalling = signal<boolean>(false);
  
  readonly shouldShow = computed(() => 
    this.installPromptService.shouldShowPrompt()
  );

  async handleInstall(): Promise<void> {
    if (this.isInstalling()) {
      return;
    }

    try {
      this.isInstalling.set(true);
      const installed = await this.installPromptService.showInstallPrompt();
      
      if (installed) {
        // Installation successful - component will hide automatically
        console.log('App installed successfully');
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      this.isInstalling.set(false);
    }
  }
}

