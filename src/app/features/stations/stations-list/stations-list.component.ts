import { Component, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
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
import { WebsocketService } from '../../../core/services/websocket.service';
import { ChargePoint, ChargePointConnector } from '../../../core/models/chargepoint.model';
import { WsCommand } from '../../../core/models/websocket.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { ConnectorUtils } from '../../../shared/utils/connector.utils';
import { SortByConnectorIdPipe } from '../../../shared/pipes';

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
  templateUrl: './stations-list.component.html',
  styleUrls: ['./stations-list.component.scss']
})
export class StationsListComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargePointService);
  private readonly authService = inject(AuthService);
  private readonly userInfoService = inject(UserInfoService);
  private readonly websocketService = inject(WebsocketService);
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
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Real-time update indicator
  protected readonly realtimeActive = signal(false);
  protected readonly updatedStationId = signal<string | null>(null);
  
  // Subscription management
  private authSubscription?: Subscription;
  private wsSubscriptionActive = false;
  private isProcessingUpdate = false;

  constructor() {
    // Set up effect to react to charge point updates
    effect(() => {
      const update = this.websocketService.chargePointUpdate();
      
      // Only process if we have an update and we're not already processing one
      if (update && update.chargePointId && !this.isProcessingUpdate) {
        this.isProcessingUpdate = true;
        
        // Clear the update signal immediately to prevent re-triggering
        this.websocketService.clearChargePointUpdate();
        
        // Only reload if not already loading to prevent infinite loops
        if (!this.loading()) {
          this.loadStations();
        }
        
        // Highlight the updated station temporarily
        this.updatedStationId.set(update.chargePointId);
        this.realtimeActive.set(true);
        
        // Clear highlight after 3 seconds and allow processing again
        setTimeout(() => {
          this.updatedStationId.set(null);
          this.realtimeActive.set(false);
          this.isProcessingUpdate = false;
        }, 3000);
      } else if (!update) {
        // If no update, allow processing again
        this.isProcessingUpdate = false;
      }
    });
  }

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
    // Initialize translations first
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
      
      // After translations are loaded, set up auth subscription
      this.setupAuthSubscription();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Still set up auth subscription even if translations fail
      this.setupAuthSubscription();
    }
  }

  private setupAuthSubscription(): void {
    // Listen for auth state changes and load stations when user becomes authenticated
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.loadStations();
        
        // Initialize WebSocket subscription for real-time updates
        this.initializeWebSocketSubscriptions();
        
        // Load user info to get access level for View Details functionality
        this.userInfoService.loadCurrentUserInfo().subscribe({
          next: (userInfo) => {
            // User info loaded successfully
          },
          error: (error) => {
            // Failed to load user info - handled by service
          }
        });
      } else {
        // Optionally clear stations when user logs out
        // this.chargePointService.clearChargePoints();
        this.wsSubscriptionActive = false;
      }
    });
  }

  /**
   * Initialize WebSocket subscriptions for real-time charge point updates
   */
  private initializeWebSocketSubscriptions(): void {
    // Only subscribe once
    if (this.wsSubscriptionActive) {
      return;
    }
    
    // Subscribe to charge point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints).catch(error => {
      console.error('[StationsList] Failed to subscribe to charge points:', error);
    });
    
    this.wsSubscriptionActive = true;
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
    return station.connectors.filter(connector => ConnectorUtils.isAvailable(connector.status)).length;
  }

  getConnectorStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'available';
      case 'charging': return 'occupied';
      case 'preparing': return 'occupied';
      case 'occupied': return 'occupied';
      case 'out_of_order': return 'out_of_order';
      case 'unavailable': return 'out_of_order';
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
      return this.translationService.get('stations.tooltips.accessRequired');
    }
    return this.translationService.get('stations.tooltips.viewDetails');
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
      return this.translationService.get('stations.tooltips.stationOffline');
    }
    if (!station.is_enabled) {
      return this.translationService.get('stations.tooltips.stationDisabled');
    }
    if (this.getAvailableConnectors(station) === 0) {
      return this.translationService.get('stations.tooltips.noAvailableConnectors');
    }
    return this.translationService.get('stations.tooltips.startCharging');
  }

  startCharge(stationId: string): void {
    this.router.navigate(['/stations', stationId, 'charge']);
  }

  /**
   * Check if a station was recently updated via WebSocket
   */
  isStationUpdated(stationId: string): boolean {
    return this.updatedStationId() === stationId;
  }
}

