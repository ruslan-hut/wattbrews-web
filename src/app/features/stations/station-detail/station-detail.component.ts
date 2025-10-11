import { Component, OnInit, OnDestroy, signal, computed, inject, Pipe, PipeTransform, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { StationDetail } from '../../../core/models/station-detail.model';
import { WsCommand, WsResponse, ResponseStage } from '../../../core/models/websocket.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { SmallMapComponent } from '../../../shared/components/small-map/small-map.component';
import { TransactionPreviewComponent } from '../../../shared/components/transaction-preview/transaction-preview.component';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { DateUtils } from '../../../shared/utils/date.utils';

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
  templateUrl: './station-detail.component.html',
  styleUrls: ['./station-detail.component.scss']
})
export class StationDetailComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargePointService);
  private readonly authService = inject(AuthService);
  private readonly websocketService = inject(WebsocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dialog = inject(MatDialog);
  protected readonly translationService = inject(SimpleTranslationService);

  // Signals
  readonly loading = this.chargePointService.loading;
  readonly error = this.chargePointService.error;
  private readonly _stationDetail = signal<StationDetail | null>(null);
  readonly stationDetail = this._stationDetail.asReadonly();
  
  // Real-time updates
  protected readonly realtimeActive = signal(false);
  protected readonly updatedConnectorIds = signal<Set<number>>(new Set());
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Subscription management
  private authSubscription?: Subscription;
  private websocketSubscription?: Subscription;
  private authCheckTimeout?: any;

  constructor() {
    // Set up effect to react to charge point updates for this specific station
    effect(() => {
      const update = this.websocketService.chargePointUpdate();
      const currentStation = this.stationDetail();
      
      if (update && currentStation && update.chargePointId === currentStation.charge_point_id) {
        // Refresh station detail
        this.loadStationDetail();
        
        // Highlight updated connector if connector_id is present
        if (update.connectorId) {
          this.highlightConnector(update.connectorId);
        }
        
        // Set real-time indicator
        this.realtimeActive.set(true);
        setTimeout(() => this.realtimeActive.set(false), 2000);
      }
    });
  }

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
    // Wait for authentication before loading station details
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
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
          this.router.navigate(['/auth/login']);
        }, 1000); // 1 second delay
      }
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
  }

  loadStationDetail(pointId?: string) {
    const id = pointId || this.route.snapshot.params['id'];
    
    if (id) {
      this.chargePointService.getStationDetail(id).subscribe({
        next: (station) => {
          this._stationDetail.set(station);
          
          // Initialize WebSocket subscriptions after station detail is loaded
          this.initializeWebSocketSubscriptions();
        },
        error: (error) => {
          // Error loading station detail - handled by service
        }
      });
    }
  }
  
  /**
   * Initialize WebSocket subscriptions for real-time updates
   * Note: WebSocket is already connected globally
   */
  private initializeWebSocketSubscriptions(): void {
    // Only subscribe if not already subscribed
    if (this.websocketSubscription) {
      return;
    }
    
    // Subscribe to charge-point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints).catch(error => {
      console.error('[StationDetail] Failed to subscribe to charge points:', error);
    });
    
    // Listen for charge-point events
    this.websocketSubscription = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => {
        this.handleChargePointEvent(message);
      }
    );
  }
  
  /**
   * Handle charge point event from WebSocket
   */
  private handleChargePointEvent(message: WsResponse): void {
    const chargePointId = message.data;
    const station = this.stationDetail();
    
    // Only handle events for this station
    if (!chargePointId || !station || chargePointId !== station.charge_point_id) {
      return;
    }
    
    // Refresh station detail
    this.loadStationDetail();
    
    // Highlight updated connector if connector_id is present
    if (message.connector_id) {
      this.highlightConnector(message.connector_id);
    }
    
    // Set real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000);
  }
  
  /**
   * Highlight a connector temporarily
   */
  private highlightConnector(connectorId: number): void {
    this.updatedConnectorIds.update(set => {
      const newSet = new Set(set);
      newSet.add(connectorId);
      return newSet;
    });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      this.updatedConnectorIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(connectorId);
        return newSet;
      });
    }, 3000);
  }
  
  /**
   * Check if a connector should be highlighted
   */
  protected isConnectorUpdated(connectorId: number): boolean {
    return this.updatedConnectorIds().has(connectorId);
  }

  goBack() {
    this.location.back();
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

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';
    return DateUtils.getTimeAgo(dateString);
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

  openTransactionDetails(transactionId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.dialog.open(TransactionPreviewComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { transactionId },
      disableClose: false,
      autoFocus: false,
      restoreFocus: false
    });
  }
}
