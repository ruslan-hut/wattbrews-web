import { Component, OnInit, OnDestroy, signal, computed, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserInfoService } from '../../../core/services/user-info.service';
import { ChargePoint, ChargePointConnector } from '../../../core/models/chargepoint.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Pipe({
  name: 'sortByConnectorId',
  standalone: true
})
export class SortByConnectorIdPipe implements PipeTransform {
  transform(connectors: ChargePointConnector[]): ChargePointConnector[] {
    if (!connectors || connectors.length === 0) {
      return connectors;
    }
    
    return [...connectors].sort((a, b) => a.connector_id - b.connector_id);
  }
}

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
    MatTooltipModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent,
    SortByConnectorIdPipe
  ],
  template: `
    <div class="stations-list-container">
      <div class="page-header">
        <h1 class="page-title">{{ translationService.getReactive('pages.stations.title') }}</h1>
        <p class="page-subtitle">{{ translationService.getReactive('pages.stations.subtitle') }}</p>
      </div>

      <!-- Authentication Required Message -->
      <div class="auth-required-message" *ngIf="!isAuthenticated()">
        <mat-icon class="auth-icon">lock</mat-icon>
        <h3>{{ translationService.getReactive('pages.profile.authRequired') }}</h3>
        <p>{{ translationService.getReactive('pages.profile.authRequiredMessage') }}</p>
        <button mat-raised-button color="primary" (click)="navigateToLogin()">
          <mat-icon>login</mat-icon>
          {{ translationService.getReactive('common.buttons.signIn') }}
        </button>
      </div>

      <!-- Search Section -->
      <div class="search-section" *ngIf="isAuthenticated()">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>{{ translationService.getReactive('pages.stations.searchLabel') }}</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchQuery" 
            (input)="onSearchChange()"
            [placeholder]="translationService.getReactive('pages.stations.searchPlaceholder')"
            autocomplete="off">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isAuthenticated() && loading()">
        <app-loading-spinner></app-loading-spinner>
        <p>{{ translationService.getReactive('pages.stations.loadingStations') }}</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="isAuthenticated() && error() && !loading()">
        <app-error-message [message]="error()!"></app-error-message>
        <button mat-raised-button color="primary" (click)="loadStations()">
          <mat-icon>refresh</mat-icon>
          {{ translationService.getReactive('common.buttons.tryAgain') }}
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
                <span class="info-text">{{ getAvailableConnectors(station) }} {{ translationService.getReactive('pages.stations.ofConnectorsAvailable').replace('{{total}}', station.connectors.length.toString()) }}</span>
              </div>
            </div>

            <div class="connectors-section">
              <h4>{{ translationService.getReactive('pages.stations.connectors') }}</h4>
              <div class="connectors-list">
                <mat-chip 
                  *ngFor="let connector of station.connectors | sortByConnectorId" 
                  [class]="getConnectorStatusClass(connector.status)"
                  class="connector-chip">
                  <mat-icon class="chip-icon">{{ getConnectorTypeIcon(connector.type) }}</mat-icon>
                  {{ (connector.connector_id_name || connector.connector_id) }} - {{ connector.type }} - {{ connector.power }}{{ translationService.getReactive('common.units.kW') }}
                </mat-chip>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="station-card-actions">
            <button 
              mat-button 
              color="accent" 
              [disabled]="!canStartCharge(station)"
              [matTooltip]="getStartChargeTooltip(station)"
              (click)="startCharge(station.charge_point_id)">
              <mat-icon>play_arrow</mat-icon>
              {{ translationService.getReactive('pages.stations.startCharge') }}
            </button>
            <button 
              mat-button 
              color="primary" 
              [disabled]="!hasViewDetailsAccess()"
              [matTooltip]="getViewDetailsTooltip(station)"
              (click)="viewStationDetails(station.charge_point_id)">
              <mat-icon>visibility</mat-icon>
              {{ translationService.getReactive('pages.stations.viewDetails') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="isAuthenticated() && !loading() && !error() && filteredStations().length === 0">
        <mat-icon class="empty-icon">ev_station</mat-icon>
        <h3>{{ translationService.getReactive('pages.stations.noStationsFound') }}</h3>
        <p *ngIf="searchQuery">{{ translationService.getReactive('pages.stations.tryAdjustingSearch') }}</p>
        <p *ngIf="!searchQuery">{{ translationService.getReactive('pages.stations.noStationsAvailable') }}</p>
        <button mat-raised-button color="primary" (click)="clearSearch()" *ngIf="searchQuery">
          {{ translationService.getReactive('common.buttons.clearSearch') }}
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
      background-color: #d1fae5;
      color: #10b981;
    }

    .connector-chip.occupied {
      background-color: #fef3c7;
      color: #f59e0b;
    }

    .connector-chip.out_of_order {
      background-color: #f3f4f6;
      color: #6b7280;
    }

    .connector-chip.reserved {
      background-color: #dbeafe;
      color: #3b82f6;
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

    .status-unavailable-yellow {
      color: #ff9800;
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

    .station-card-actions {
      margin-top: 1rem !important;
      padding-top: 1rem !important;
      border-top: 1px solid #e9ecef;
      justify-content: space-between;
      align-items: center;
    }

    .station-card-actions button {
      margin: 0 0.25rem;
    }

    .station-card-actions button:first-child {
      margin-left: 0;
    }

    .station-card-actions button:last-child {
      margin-right: 0;
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
export class StationsListComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargePointService);
  private readonly authService = inject(AuthService);
  private readonly userInfoService = inject(UserInfoService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly router = inject(Router);

  // Signals
  readonly loading = this.chargePointService.loading;
  readonly error = this.chargePointService.error;
  readonly allStations = this.chargePointService.chargePoints;
  readonly isAuthenticated = this.authService.isAuthenticated;

  // Search functionality
  searchQuery = '';
  private readonly _searchQuery = signal('');
  
  // Subscription management
  private authSubscription?: Subscription;

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
    // Listen for auth state changes and load stations when user becomes authenticated
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        console.log('User authenticated, loading stations and user info...');
        this.loadStations();
        // Load user info to get access level for View Details functionality
        this.userInfoService.loadCurrentUserInfo().subscribe({
          next: (userInfo) => {
            console.log('User info loaded, access level:', userInfo.access_level);
          },
          error: (error) => {
            console.error('Failed to load user info:', error);
          }
        });
      } else {
        console.log('User not authenticated, clearing stations...');
        // Optionally clear stations when user logs out
        // this.chargePointService.clearChargePoints();
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscription to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
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
    return availableConnectors > 0 ? 'check_circle' : 'warning';
  }

  getStatusIconClass(station: ChargePoint): string {
    if (!station.is_online) return 'status-offline';
    const availableConnectors = this.getAvailableConnectors(station);
    return availableConnectors > 0 ? 'status-available' : 'status-unavailable-yellow';
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
      case 'reserved': return 'reserved';
      default: return 'out_of_order';
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
    this.router.navigate(['/stations', stationId]);
  }

  hasViewDetailsAccess(): boolean {
    return this.userInfoService.getAccessLevel() >= 5;
  }

  getViewDetailsTooltip(station: ChargePoint): string {
    if (!this.hasViewDetailsAccess()) {
      return this.translationService.get('pages.stations.tooltips.accessRequired');
    }
    return this.translationService.get('pages.stations.tooltips.viewDetails');
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  canStartCharge(station: ChargePoint): boolean {
    return station.is_online && 
           station.is_enabled && 
           this.getAvailableConnectors(station) > 0;
  }

  getStartChargeTooltip(station: ChargePoint): string {
    if (!station.is_online) {
      return this.translationService.get('pages.stations.tooltips.stationOffline');
    }
    if (!station.is_enabled) {
      return this.translationService.get('pages.stations.tooltips.stationDisabled');
    }
    if (this.getAvailableConnectors(station) === 0) {
      return this.translationService.get('pages.stations.tooltips.noAvailableConnectors');
    }
    return this.translationService.get('pages.stations.tooltips.startCharging');
  }

  startCharge(stationId: string): void {
    this.router.navigate(['/stations', stationId, 'charge']);
  }
}
