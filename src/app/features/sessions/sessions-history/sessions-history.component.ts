import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sessions-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sessions-history-container">
      <h2>Sessions History</h2>
      <p>Sessions history component - Coming soon</p>
    </div>
  `,
  styles: [`
    .sessions-history-container {
      padding: 20px;
    }
  `]
})
export class SessionsHistoryComponent {}
