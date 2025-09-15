import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="station-detail-container">
      <h2>Station Detail</h2>
      <p>Station detail component - Coming soon</p>
    </div>
  `,
  styles: [`
    .station-detail-container {
      padding: 20px;
    }
  `]
})
export class StationDetailComponent {}
