import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container">
      <h2>Notifications</h2>
      <p>Notifications component - Coming soon</p>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
    }
  `]
})
export class NotificationsComponent {}
