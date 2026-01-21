import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-stations-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
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
