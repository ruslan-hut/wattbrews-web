import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-session-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
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
