import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stations-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stations-map-container">
      <h2>Stations Map</h2>
      <p>Stations map component - Coming soon</p>
    </div>
  `,
  styles: [`
    .stations-map-container {
      padding: 20px;
    }
  `]
})
export class StationsMapComponent {}
