import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <h2>Settings</h2>
      <p>Settings component - Coming soon</p>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
    }
  `]
})
export class SettingsComponent {}
