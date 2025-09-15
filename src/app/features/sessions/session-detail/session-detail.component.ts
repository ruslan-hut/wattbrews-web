import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="session-detail-container">
      <h2>Session Detail</h2>
      <p>Session detail component - Coming soon</p>
    </div>
  `,
  styles: [`
    .session-detail-container {
      padding: 20px;
    }
  `]
})
export class SessionDetailComponent {}
