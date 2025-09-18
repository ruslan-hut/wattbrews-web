import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stations-list-container">
      <div class="page-header">
        <h1 class="page-title">Charging Stations</h1>
        <p class="page-subtitle">Find and connect to available charging stations</p>
      </div>
      <div class="coming-soon-card">
        <mat-icon class="coming-soon-icon">ev_station</mat-icon>
        <h3>Stations List</h3>
        <p>This feature is coming soon. You'll be able to browse and filter charging stations here.</p>
      </div>
    </div>
  `,
  styles: [`
    .stations-list-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .page-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2c3e50;
    }
    
    .page-subtitle {
      font-size: 1.1rem;
      color: #5a6c7d;
      margin: 0;
    }
    
    .coming-soon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 60px 40px;
      text-align: center;
      background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
      border: 1px solid #dadce0;
      border-radius: 16px;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .coming-soon-icon {
      font-size: 4rem;
      color: #6c757d;
    }
    
    .coming-soon-card h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .coming-soon-card p {
      margin: 0;
      color: #5a6c7d;
      font-size: 1rem;
      line-height: 1.5;
    }
  `]
})
export class StationsListComponent {}
