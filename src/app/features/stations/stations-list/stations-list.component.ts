import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stations-list-container">
      <h2>Charging Stations</h2>
      <p>Stations list component - Coming soon</p>
    </div>
  `,
  styles: [`
    .stations-list-container {
      padding: 20px;
    }
  `]
})
export class StationsListComponent {}
