import { Component, OnInit, OnDestroy, signal, computed, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { AuthService } from '../../../core/services/auth.service';
import { StationDetail } from '../../../core/models/station-detail.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { SmallMapComponent } from '../../../shared/components/small-map/small-map.component';

@Pipe({
  name: 'sortByConnectorId',
  standalone: true
})
export class SortByConnectorIdPipe implements PipeTransform {
  transform(connectors: any[]): any[] {
    if (!connectors || connectors.length === 0) {
      return connectors;
    }
    
    return [...connectors].sort((a, b) => a.connector_id - b.connector_id);
  }
}

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    SmallMapComponent,
    SortByConnectorIdPipe
  ],
  template: `
    <div class="station-detail-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 class="page-title">Station Details</h1>
          <p class="page-subtitle" *ngIf="stationDetail()">{{ stationDetail()!.title }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <app-loading-spinner></app-loading-spinner>
        <p>Loading station details...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error() && !loading()">
        <app-error-message [message]="error()!"></app-error-message>
        <button mat-raised-button color="primary" (click)="loadStationDetail()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>

      <!-- Station Details -->
      <div class="station-details" *ngIf="stationDetail() && !loading() && !error()">
        <!-- Basic Information -->
        <mat-card class="info-card">
          <mat-card-header>
            <div mat-card-avatar class="station-status-icon">
              <mat-icon [class]="getStatusIconClass()">{{ getStatusIcon() }}</mat-icon>
            </div>
            <mat-card-title>{{ stationDetail()!.title }}</mat-card-title>
            <mat-card-subtitle>{{ stationDetail()!.charge_point_id }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <mat-icon class="info-icon">location_on</mat-icon>
                <div class="info-content">
                  <span class="info-label">Address</span>
                  <span class="info-value">{{ stationDetail()!.address }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon class="info-icon">business</mat-icon>
                <div class="info-content">
                  <span class="info-label">Vendor</span>
                  <span class="info-value">{{ stationDetail()!.vendor }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon class="info-icon">memory</mat-icon>
                <div class="info-content">
                  <span class="info-label">Model</span>
                  <span class="info-value">{{ stationDetail()!.model }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon class="info-icon">tag</mat-icon>
                <div class="info-content">
                  <span class="info-label">Serial Number</span>
                  <span class="info-value">{{ stationDetail()!.serial_number }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon class="info-icon">update</mat-icon>
                <div class="info-content">
                  <span class="info-label">Firmware Version</span>
                  <span class="info-value">{{ stationDetail()!.firmware_version }}</span>
                </div>
              </div>
              
              <div class="info-item">
                <mat-icon class="info-icon">schedule</mat-icon>
                <div class="info-content">
                  <span class="info-label">Last Seen</span>
                  <span class="info-value">{{ formatDateTime(stationDetail()!.event_time) }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Status Information -->
        <mat-card class="status-card">
          <mat-card-header>
            <mat-card-title>Status Information</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="status-grid">
              <div class="status-item">
                <mat-chip [class]="getStatusChipClass(stationDetail()!.status)">
                  {{ stationDetail()!.status }}
                </mat-chip>
                <span class="status-label">Current Status</span>
              </div>
              
              <div class="status-item">
                <mat-chip [class]="getErrorChipClass(stationDetail()!.error_code)">
                  {{ stationDetail()!.error_code }}
                </mat-chip>
                <span class="status-label">Error Code</span>
              </div>
              
              <div class="status-item">
                <mat-chip [class]="stationDetail()!.is_online ? 'online' : 'offline'">
                  {{ stationDetail()!.is_online ? 'Online' : 'Offline' }}
                </mat-chip>
                <span class="status-label">Connection</span>
              </div>
              
              <div class="status-item">
                <mat-chip [class]="stationDetail()!.is_enabled ? 'enabled' : 'disabled'">
                  {{ stationDetail()!.is_enabled ? 'Enabled' : 'Disabled' }}
                </mat-chip>
                <span class="status-label">Availability</span>
              </div>
            </div>
            
            <div class="status-info" *ngIf="stationDetail()!.info">
              <p><strong>Info:</strong> {{ stationDetail()!.info }}</p>
            </div>
            
            <div class="status-times">
              <p><strong>Status Time:</strong> {{ formatDateTime(stationDetail()!.status_time) }}</p>
              <p><strong>Event Time:</strong> {{ formatDateTime(stationDetail()!.event_time) }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Location Information -->
        <mat-card class="location-card" *ngIf="stationDetail()!.location">
          <mat-card-header>
            <mat-card-title>Location</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="location-info">
              <div class="location-item">
                <mat-icon class="location-icon">place</mat-icon>
                <div class="location-details">
                  <span class="location-label">Coordinates</span>
                  <span class="location-value">
                    {{ stationDetail()!.location.latitude }}, {{ stationDetail()!.location.longitude }}
                  </span>
                </div>
              </div>
              
              <!-- Small Map View -->
              <div class="map-section">
                <app-small-map
                  [latitude]="stationDetail()!.location.latitude"
                  [longitude]="stationDetail()!.location.longitude"
                  [title]="stationDetail()!.title"
                  [height]="'200px'"
                  [zoom]="15">
                </app-small-map>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Connectors -->
        <mat-card class="connectors-card">
          <mat-card-header>
            <mat-card-title>Connectors ({{ stationDetail()!.connectors.length }})</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="connectors-grid">
              <div 
                *ngFor="let connector of stationDetail()!.connectors | sortByConnectorId" 
                class="connector-item"
                [class.available]="connector.status === 'Available'"
                [class.occupied]="connector.status === 'Occupied'"
                [class.out-of-order]="connector.status === 'OutOfOrder'">
                
                <div class="connector-header">
                  <h4>Connector {{ (connector.connector_id_name || connector.connector_id) }}</h4>
                  <mat-chip [class]="getConnectorStatusClass(connector.status)">
                    {{ connector.status }}
                  </mat-chip>
                </div>
                
                <div class="connector-details">
                  <div class="connector-info">
                    <span class="connector-label">Type:</span>
                    <span class="connector-value">{{ connector.type }}</span>
                  </div>
                  
                  <div class="connector-info">
                    <span class="connector-label">Power:</span>
                    <span class="connector-value">{{ connector.power }} kW</span>
                  </div>
                  
                  <div class="connector-info">
                    <span class="connector-label">Vendor:</span>
                    <span class="connector-value">{{ connector.vendor_id }}</span>
                  </div>
                  
                  <div class="connector-info">
                    <span class="connector-label">Error Code:</span>
                    <span class="connector-value">{{ connector.error_code }}</span>
                  </div>
                  
                  <div class="connector-info" *ngIf="connector.current_transaction_id > 0">
                    <span class="connector-label">Transaction ID:</span>
                    <span class="connector-value">#{{ connector.current_transaction_id }}</span>
                  </div>
                </div>
                
                <div class="connector-status-info" *ngIf="connector.info">
                  <p><strong>Info:</strong> {{ connector.info }}</p>
                </div>
                
                <div class="connector-time">
                  <p><strong>Status Time:</strong> {{ formatDateTime(connector.status_time) }}</p>
                </div>
              </div>
            </div>
            
            <!-- Start Charge Button -->
            <div class="start-charge-section" *ngIf="hasAvailableConnectors()">
              <button 
                mat-raised-button 
                color="primary" 
                class="start-charge-button"
                (click)="startCharge()">
                <mat-icon>play_arrow</mat-icon>
                Start Charge
              </button>
              <p class="start-charge-info">Click to begin charging at this station</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .station-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 2rem;
    }
    
    .back-button {
      color: #666;
    }
    
    .header-content {
      flex: 1;
    }
    
    .page-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0;
      color: #2c3e50;
    }
    
    .page-subtitle {
      font-size: 1.1rem;
      color: #5a6c7d;
      margin: 4px 0 0 0;
    }
    
    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }
    
    .station-details {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    mat-card {
      background-color: white !important;
    }
    
    .info-card, .status-card, .location-card, .connectors-card {
      border-radius: 12px;
      overflow: hidden;
      background-color: white !important;
    }
    
    .station-status-icon {
      background: none;
      color: inherit;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    
    .info-icon {
      color: #6c757d;
      font-size: 1.2rem;
    }
    
    .info-content {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .info-value {
      font-size: 1rem;
      color: #2c3e50;
      font-weight: 400;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 1rem;
      border-radius: 8px;
    }
    
    .status-label {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .status-info, .status-times {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
    }
    
    .status-info p, .status-times p {
      margin: 0.5rem 0;
      color: #2c3e50;
    }
    
    .location-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .map-section {
      margin-top: 1rem;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .location-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .location-icon {
      color: #6c757d;
      font-size: 1.2rem;
    }
    
    .location-details {
      display: flex;
      flex-direction: column;
    }
    
    .location-label {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .location-value {
      font-size: 1rem;
      color: #2c3e50;
      font-weight: 400;
      font-family: monospace;
    }
    
    .connectors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1rem;
    }
    
    .connector-item {
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 1rem;
      transition: all 0.3s ease;
    }
    
    .connector-item.available {
      border-color: #28a745;
    }
    
    .connector-item.occupied {
      border-color: #ffc107;
    }
    
    .connector-item.out-of-order {
      border-color: #dc3545;
    }
    
    .connector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .connector-header h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .connector-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .connector-info {
      display: flex;
      flex-direction: column;
    }
    
    @media (max-width: 768px) {
      .connector-info {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
      }
    }
    
    .connector-label {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .connector-value {
      font-size: 0.9rem;
      color: #2c3e50;
      font-weight: 400;
    }
    
    .connector-status-info, .connector-time {
      margin-top: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
    }
    
    .connector-status-info p, .connector-time p {
      margin: 0;
      font-size: 0.9rem;
      color: #2c3e50;
    }
    
    .status-available { color: #28a745; }
    .status-unavailable { color: #dc3545; }
    .status-unavailable-yellow { color: #ff9800; }
    .status-offline { color: #6c757d; }
    
    .online { color: #155724; }
    .offline { color: #721c24; }
    .enabled { color: #155724; }
    .disabled { color: #721c24; }
    
    .available { 
      background-color: #d1fae5;
      color: #10b981;
    }
    .occupied { 
      background-color: #fef3c7;
      color: #f59e0b;
    }
    .out-of-order { 
      background-color: #f3f4f6;
      color: #6b7280;
    }
    .reserved {
      background-color: #dbeafe;
      color: #3b82f6;
    }
    .no-error { color: #155724; }
    .error { color: #721c24; }
    
    .start-charge-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 2rem;
      background-color: #f8f9fa;
      border-radius: 12px;
    }
    
    .start-charge-button {
      font-size: 1.2rem;
      padding: 1rem 2rem;
      min-width: 200px;
    }
    
    .start-charge-info {
      text-align: center;
      color: #6c757d;
      margin: 0;
    }
    
    @media (max-width: 768px) {
      .info-grid, .status-grid, .connectors-grid {
        grid-template-columns: 1fr;
      }
      
      .connector-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StationDetailComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargePointService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Signals
  readonly loading = this.chargePointService.loading;
  readonly error = this.chargePointService.error;
  private readonly _stationDetail = signal<StationDetail | null>(null);
  readonly stationDetail = this._stationDetail.asReadonly();
  
  // Subscription management
  private authSubscription?: Subscription;
  private authCheckTimeout?: any;

  ngOnInit() {
    // Wait for authentication before loading station details
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        console.log('StationDetailComponent: User authenticated, loading station detail');
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout);
        }
        this.route.params.subscribe(params => {
          const pointId = params['id'];
          if (pointId) {
            this.loadStationDetail(pointId);
          }
        });
      } else {
        // Give Firebase auth time to restore session on page reload
        // Only redirect after a short delay to avoid premature redirects
        this.authCheckTimeout = setTimeout(() => {
          console.log('StationDetailComponent: User not authenticated after timeout, redirecting to login');
          this.router.navigate(['/auth/login']);
        }, 1000); // 1 second delay
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
  }

  loadStationDetail(pointId?: string) {
    const id = pointId || this.route.snapshot.params['id'];
    console.log('StationDetailComponent: Loading station detail for ID:', id);
    
    if (id) {
      this.chargePointService.getStationDetail(id).subscribe({
        next: (station) => {
          console.log('StationDetailComponent: Station detail loaded successfully:', station);
          this._stationDetail.set(station);
        },
        error: (error) => {
          console.error('StationDetailComponent: Error loading station detail:', error);
          console.error('StationDetailComponent: Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
        }
      });
    } else {
      console.error('StationDetailComponent: No point ID provided');
    }
  }

  goBack() {
    this.router.navigate(['/stations']);
  }

  getStatusIcon(): string {
    const station = this.stationDetail();
    if (!station) return 'help';
    if (!station.is_online) return 'wifi_off';
    const availableConnectors = station.connectors.filter(c => c.status === 'Available').length;
    return availableConnectors > 0 ? 'check_circle' : 'warning';
  }

  getStatusIconClass(): string {
    const station = this.stationDetail();
    if (!station) return '';
    if (!station.is_online) return 'status-offline';
    const availableConnectors = station.connectors.filter(c => c.status === 'Available').length;
    return availableConnectors > 0 ? 'status-available' : 'status-unavailable-yellow';
  }

  getStatusChipClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'outoforder': return 'out-of-order';
      case 'out_of_order': return 'out-of-order';
      case 'reserved': return 'reserved';
      default: return 'out-of-order';
    }
  }

  getErrorChipClass(errorCode: string): string {
    return errorCode === 'NoError' ? 'no-error' : 'error';
  }

  getConnectorStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'outoforder': return 'out-of-order';
      case 'out_of_order': return 'out-of-order';
      case 'reserved': return 'reserved';
      default: return 'out-of-order';
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  }

  hasAvailableConnectors(): boolean {
    const station = this.stationDetail();
    if (!station) return false;
    return station.connectors.some(connector => connector.status === 'Available');
  }

  startCharge(): void {
    const station = this.stationDetail();
    if (!station) return;
    
    this.router.navigate(['/stations', station.charge_point_id, 'charge']);
  }
}
