import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChargePoint } from '../../../core/models/chargepoint.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  template: `
    <div class="stations-list-container">
      <div class="page-header">
        <h1 class="page-title">Charging Stations</h1>
        <p class="page-subtitle">Find and connect to available charging stations</p>
      </div>

      <!-- Authentication Required Message -->
      <div class="auth-required-message" *ngIf="!isAuthenticated()">
        <mat-icon class="auth-icon">lock</mat-icon>
        <h3>Authentication Required</h3>
        <p>You need to be logged in to view charging stations. Please sign in to continue.</p>
        <button mat-raised-button color="primary" (click)="navigateToLogin()">
          <mat-icon>login</mat-icon>
          Sign In
        </button>
      </div>

      <!-- Search Section -->
      <div class="search-section" *ngIf="isAuthenticated()">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search stations by name or address</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchQuery" 
            (input)="onSearchChange()"
            placeholder="Type to search..."
            autocomplete="off">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isAuthenticated() && loading()">
        <app-loading-spinner></app-loading-spinner>
        <p>Loading charging stations...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="isAuthenticated() && error() && !loading()">
        <app-error-message [message]="error()!"></app-error-message>
        <button mat-raised-button color="primary" (click)="loadStations()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>

      <!-- Stations List -->
      <div class="stations-grid" *ngIf="isAuthenticated() && !loading() && !error()">
        <mat-card 
          *ngFor="let station of filteredStations(); trackBy: trackByStationId" 
          class="station-card"
          [class.offline]="!station.is_online"
          [class.disabled]="!station.is_enabled">
          
          <mat-card-header>
            <div mat-card-avatar class="station-status-icon">
              <mat-icon [class]="getStatusIconClass(station)">{{ getStatusIcon(station) }}</mat-icon>
            </div>
            <mat-card-title class="station-title">{{ station.title }}</mat-card-title>
            <mat-card-subtitle class="station-address">{{ station.address }}</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="station-info">
              <div class="info-row">
                <mat-icon class="info-icon">location_on</mat-icon>
                <span class="info-text">{{ station.vendor }} {{ station.model }}</span>
              </div>
              
              
              <div class="info-row">
                <mat-icon class="info-icon">electrical_services</mat-icon>
                <span class="info-text">{{ getAvailableConnectors(station) }} of {{ station.connectors.length }} connectors available</span>
              </div>
            </div>

            <div class="connectors-section">
              <h4>Connectors</h4>
              <div class="connectors-list">
                <mat-chip 
                  *ngFor="let connector of station.connectors" 
                  [class]="getConnectorStatusClass(connector.status)"
                  class="connector-chip">
                  <mat-icon class="chip-icon">{{ getConnectorTypeIcon(connector.type) }}</mat-icon>
                  {{ connector.type }} - {{ connector.power }}kW
                </mat-chip>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-button 
              color="primary" 
              [disabled]="!station.is_online || !station.is_enabled"
              (click)="viewStationDetails(station.charge_point_id)">
              <mat-icon>visibility</mat-icon>
              View Details
            </button>
            
            <button 
              mat-icon-button 
              [color]="station.is_online ? 'warn' : 'primary'"
              [disabled]="!station.is_enabled"
              (click)="toggleStationStatus(station)">
              <mat-icon>{{ station.is_online ? 'pause' : 'play_arrow' }}</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="isAuthenticated() && !loading() && !error() && filteredStations().length === 0">
        <mat-icon class="empty-icon">ev_station</mat-icon>
        <h3>No stations found</h3>
        <p *ngIf="searchQuery">Try adjusting your search terms</p>
        <p *ngIf="!searchQuery">No charging stations are currently available</p>
        <button mat-raised-button color="primary" (click)="clearSearch()" *ngIf="searchQuery">
          Clear Search
        </button>
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

    .auth-required-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .auth-icon {
      font-size: 1.5rem;
      color: #6c757d;
    }

    .auth-required-message h3 {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .auth-required-message p {
      margin: 0;
      color: #6c757d;
      font-size: 1rem;
      line-height: 1.5;
    }

    .search-section {
      margin-bottom: 1.5rem;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: center;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }

    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .station-card {
      transition: all 0.3s ease;
      border-radius: 12px;
      overflow: hidden;
      background-color: white;
    }

    .station-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .station-card.offline {
      opacity: 0.7;
      border-left: 4px solid #f44336;
    }

    .station-card.disabled {
      opacity: 0.5;
      border-left: 4px solid #ff9800;
    }

    .station-status-icon {
      background: none;
      color: inherit;
    }

    .station-title {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
      text-align: left;
    }

    .station-address {
      color: #6c757d;
      font-size: 0.9rem;
      text-align: left;
      word-wrap: break-word;
      word-break: break-word;
      white-space: normal;
      line-height: 1.4;
      display: block;
      width: 100%;
    }

    .station-address ::ng-deep {
      text-align: left !important;
    }

    .station-info {
      margin-bottom: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .info-icon {
      font-size: 1.1rem;
      color: #6c757d;
    }

    .info-text {
      font-size: 0.9rem;
      color: #2c3e50;
    }

    .connectors-section h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: #2c3e50;
    }

    .connectors-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .connector-chip {
      font-size: 0.8rem;
      height: 32px;
      display: flex !important;
      align-items: center !important;
    }

    .connector-chip ::ng-deep .mat-mdc-chip-action {
      display: flex !important;
      align-items: center !important;
      flex-direction: row !important;
      height: 100%;
      padding: 0 8px;
      gap: 4px;
      white-space: nowrap;
      line-height: 1;
    }

    .connector-chip ::ng-deep .mat-mdc-chip-action .mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
      vertical-align: middle;
    }

    .connector-chip ::ng-deep .mat-mdc-chip-action .mat-mdc-chip-action-label {
      display: inline !important;
      line-height: 1;
      vertical-align: middle;
    }

    .connector-chip.available {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .connector-chip.occupied {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .connector-chip.out_of_order {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .chip-icon {
      font-size: 1rem;
      margin-right: 0.25rem;
    }

    .status-available {
      color: #4caf50;
    }

    .status-unavailable {
      color: #f44336;
    }

    .status-offline {
      color: #9e9e9e;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .empty-icon {
      font-size: 4rem;
      color: #6c757d;
    }

    .empty-state h3 {
      margin: 0;
      color: #2c3e50;
    }

    .empty-state p {
      margin: 0;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .stations-grid {
        grid-template-columns: 1fr;
      }
      
      .search-section {
        padding: 0.75rem;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class StationsListComponent implements OnInit {
  private readonly chargePointService = inject(ChargePointService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals
  readonly loading = this.chargePointService.loading;
  readonly error = this.chargePointService.error;
  readonly allStations = this.chargePointService.chargePoints;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Search functionality
  searchQuery = '';
  private readonly _searchQuery = signal('');

  // Computed filtered stations
  readonly filteredStations = computed(() => {
    const stations = this.allStations();
    const query = this._searchQuery().toLowerCase().trim();
    
    if (!query) {
      return stations;
    }

    return stations.filter(station => 
      station.title.toLowerCase().includes(query) ||
      station.address.toLowerCase().includes(query) ||
      station.vendor.toLowerCase().includes(query) ||
      station.model.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    // Only load stations if user is authenticated
    if (this.isAuthenticated()) {
      this.loadStations();
    }
  }

  loadStations() {
    this.chargePointService.loadChargePoints().subscribe();
  }

  onSearchChange() {
    this._searchQuery.set(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this._searchQuery.set('');
  }

  trackByStationId(index: number, station: ChargePoint): string {
    return station.charge_point_id;
  }

  getStatusIcon(station: ChargePoint): string {
    if (!station.is_online) return 'wifi_off';
    const availableConnectors = this.getAvailableConnectors(station);
    return availableConnectors > 0 ? 'check_circle' : 'cancel';
  }

  getStatusIconClass(station: ChargePoint): string {
    if (!station.is_online) return 'status-offline';
    const availableConnectors = this.getAvailableConnectors(station);
    return availableConnectors > 0 ? 'status-available' : 'status-unavailable';
  }

  getTotalPower(station: ChargePoint): number {
    return station.connectors.reduce((total, connector) => total + connector.power, 0);
  }

  getAvailableConnectors(station: ChargePoint): number {
    return station.connectors.filter(connector => connector.status === 'Available').length;
  }

  getConnectorStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'out_of_order': return 'out_of_order';
      default: return '';
    }
  }

  getConnectorTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'type_1': return 'power';
      case 'type_2': return 'power';
      case 'ccs': return 'flash_on';
      case 'chademo': return 'bolt';
      case 'tesla': return 'electric_car';
      default: return 'power';
    }
  }

  viewStationDetails(stationId: string) {
    // Navigate to station detail page
    console.log('Navigate to station:', stationId);
  }

  toggleStationStatus(station: ChargePoint) {
    if (station.is_online) {
      this.chargePointService.disableChargePoint(station.charge_point_id).subscribe();
    } else {
      this.chargePointService.enableChargePoint(station.charge_point_id).subscribe();
    }
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
