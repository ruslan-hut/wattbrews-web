import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="active-sessions-container">
      <h2>Active Sessions</h2>
      <p>Active sessions component - Coming soon</p>
    </div>
  `,
  styles: [`
    .active-sessions-container {
      padding: 20px;
    }
  `]
})
export class ActiveSessionsComponent {}
