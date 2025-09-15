import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">Welcome to WattBrews</h1>
      <p class="dashboard-subtitle">Your EV charging management platform</p>
      
      <div class="dashboard-grid">
        <!-- Quick Actions -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="quick-actions">
              <button mat-raised-button color="primary" routerLink="/stations">
                <mat-icon>ev_station</mat-icon>
                Find Stations
              </button>
              <button mat-raised-button color="accent" routerLink="/sessions/active">
                <mat-icon>charging_station</mat-icon>
                Active Sessions
              </button>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Recent Activity -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="activity-list">
              <div class="activity-item" *ngFor="let activity of recentActivities()">
                <mat-icon class="activity-icon">{{ activity.icon }}</mat-icon>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.text }}</p>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Statistics -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Statistics</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <mat-icon class="stat-icon">battery_charging_full</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ totalSessions() }}</span>
                  <span class="stat-label">Total Sessions</span>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon class="stat-icon">flash_on</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ totalEnergy() }} kWh</span>
                  <span class="stat-label">Energy Delivered</span>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon class="stat-icon">euro</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">€{{ totalCost() }}</span>
                  <span class="stat-label">Total Cost</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Nearby Stations -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Nearby Stations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="nearby-stations">
              <div class="station-item" *ngFor="let station of nearbyStations()">
                <div class="station-info">
                  <h4 class="station-name">{{ station.name }}</h4>
                  <p class="station-address">{{ station.address }}</p>
                  <span class="station-distance">{{ station.distance }} km away</span>
                </div>
                <div class="station-status" [class.available]="station.available">
                  {{ station.available ? 'Available' : 'Busy' }}
                </div>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/stations" class="view-all-button">
              View All Stations
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .dashboard-subtitle {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .dashboard-card {
      height: fit-content;
    }
    
    .quick-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .quick-actions button {
      flex: 1;
      min-width: 150px;
    }
    
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    
    .activity-icon {
      color: #666;
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-text {
      margin: 0;
      font-size: 0.9rem;
    }
    
    .activity-time {
      font-size: 0.8rem;
      color: #999;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .stat-icon {
      color: #2196f3;
      font-size: 2rem;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #666;
    }
    
    .nearby-stations {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .station-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .station-info {
      flex: 1;
    }
    
    .station-name {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .station-address {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .station-distance {
      font-size: 0.8rem;
      color: #999;
    }
    
    .station-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      background-color: #f44336;
      color: white;
    }
    
    .station-status.available {
      background-color: #4caf50;
    }
    
    .view-all-button {
      width: 100%;
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 10px;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .quick-actions {
        flex-direction: column;
      }
      
      .quick-actions button {
        min-width: auto;
      }
    }
  `]
})
export class DashboardComponent {
  protected readonly totalSessions = signal(24);
  protected readonly totalEnergy = signal(156.8);
  protected readonly totalCost = signal(89.50);
  
  protected readonly recentActivities = signal([
    {
      icon: 'charging_station',
      text: 'Charging session completed at Tesla Supercharger',
      time: '2 hours ago'
    },
    {
      icon: 'ev_station',
      text: 'Added new favorite station',
      time: '1 day ago'
    },
    {
      icon: 'payment',
      text: 'Payment processed successfully',
      time: '2 days ago'
    }
  ]);
  
  protected readonly nearbyStations = signal([
    {
      name: 'Tesla Supercharger',
      address: '123 Main St, Madrid',
      distance: 0.5,
      available: true
    },
    {
      name: 'Ionity Charging',
      address: '456 Oak Ave, Madrid',
      distance: 1.2,
      available: false
    },
    {
      name: 'Repsol Charging',
      address: '789 Pine St, Madrid',
      distance: 2.1,
      available: true
    }
  ]);
}
