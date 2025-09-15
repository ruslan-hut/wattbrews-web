import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { ChargePointService } from '../../core/services/chargepoint.service';
import { AuthService } from '../../core/services/auth.service';
import { ChargePoint } from '../../core/models/chargepoint.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
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
        
        <!-- Charge Points Statistics -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Charge Points Overview</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="loading-container" *ngIf="chargePointService.loading()">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading charge points...</p>
            </div>
            
            <div class="error-container" *ngIf="chargePointService.error()">
              <mat-icon class="error-icon">error</mat-icon>
              <p>{{ chargePointService.error() }}</p>
              <button mat-button color="primary" (click)="refreshChargePoints()">
                Retry
              </button>
            </div>
            
            <div class="stats-grid" *ngIf="!chargePointService.loading() && !chargePointService.error()">
              <div class="stat-item">
                <mat-icon class="stat-icon">ev_station</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ chargePointService.chargePoints().length }}</span>
                  <span class="stat-label">Total Charge Points</span>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon class="stat-icon">wifi</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ chargePointService.onlineChargePoints().length }}</span>
                  <span class="stat-label">Online</span>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon class="stat-icon">check_circle</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ chargePointService.availableChargePoints().length }}</span>
                  <span class="stat-label">Available</span>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon class="stat-icon">power</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ chargePointService.availableConnectors() }}</span>
                  <span class="stat-label">Available Connectors</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        
        <!-- Charge Points List -->
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Recent Charge Points</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="loading-container" *ngIf="chargePointService.loading()">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading charge points...</p>
            </div>
            
            <div class="error-container" *ngIf="chargePointService.error()">
              <mat-icon class="error-icon">error</mat-icon>
              <p>{{ chargePointService.error() }}</p>
              <button mat-button color="primary" (click)="refreshChargePoints()">
                Retry
              </button>
            </div>
            
            <div class="charge-points-list" *ngIf="!chargePointService.loading() && !chargePointService.error()">
              <div class="charge-point-item" *ngFor="let cp of recentChargePoints()">
                <div class="charge-point-info">
                  <h4 class="charge-point-title">{{ cp.title }}</h4>
                  <p class="charge-point-address">{{ cp.address }}</p>
                  <div class="charge-point-details">
                    <mat-chip-set>
                      <mat-chip [class.online]="cp.is_online" [class.offline]="!cp.is_online">
                        {{ cp.is_online ? 'Online' : 'Offline' }}
                      </mat-chip>
                      <mat-chip [class.available]="cp.status === 'Available'" [class.busy]="cp.status !== 'Available'">
                        {{ cp.status }}
                      </mat-chip>
                      <mat-chip>{{ cp.vendor }}</mat-chip>
                    </mat-chip-set>
                  </div>
                  <div class="connectors-info">
                    <span class="connectors-count">{{ cp.connectors.length }} connectors</span>
                    <span class="available-connectors">
                      {{ getAvailableConnectors(cp) }} available
                    </span>
                  </div>
                </div>
                <div class="charge-point-actions">
                  <button mat-icon-button [disabled]="!cp.is_enabled">
                    <mat-icon>power_settings_new</mat-icon>
                  </button>
                </div>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/stations" class="view-all-button">
              View All Charge Points
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
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
      text-align: center;
    }
    
    .error-icon {
      color: #f44336;
      font-size: 3rem;
    }
    
    .charge-points-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .charge-point-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: box-shadow 0.2s;
    }
    
    .charge-point-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .charge-point-info {
      flex: 1;
    }
    
    .charge-point-title {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
    }
    
    .charge-point-address {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .charge-point-details {
      margin-bottom: 8px;
    }
    
    .connectors-info {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #666;
    }
    
    .charge-point-actions {
      display: flex;
      align-items: center;
    }
    
    .mat-chip.online {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.offline {
      background-color: #f44336;
      color: white;
    }
    
    .mat-chip.available {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.busy {
      background-color: #ff9800;
      color: white;
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
      
      .charge-point-item {
        flex-direction: column;
        gap: 12px;
      }
      
      .charge-point-actions {
        align-self: flex-end;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  protected readonly chargePointService = inject(ChargePointService);
  protected readonly authService = inject(AuthService);
  
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
  
  ngOnInit(): void {
    // Wait for authentication before loading charge points
    this.authService.user$.subscribe(user => {
      if (user) {
        console.log('User authenticated, loading charge points');
        this.loadChargePoints();
      } else {
        console.log('User not authenticated, skipping charge points load');
      }
    });
  }
  
  protected recentChargePoints(): ChargePoint[] {
    return this.chargePointService.chargePoints().slice(0, 5);
  }
  
  protected getAvailableConnectors(chargePoint: ChargePoint): number {
    return chargePoint.connectors.filter(conn => conn.status === 'Available').length;
  }
  
  protected refreshChargePoints(): void {
    this.chargePointService.clearError();
    this.loadChargePoints();
  }
  
  private loadChargePoints(): void {
    console.log('Attempting to load charge points...');
    this.chargePointService.loadChargePoints().subscribe({
      next: (chargePoints) => {
        console.log('Charge points loaded successfully:', chargePoints);
      },
      error: (error) => {
        console.error('Error loading charge points:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
      }
    });
  }
}
