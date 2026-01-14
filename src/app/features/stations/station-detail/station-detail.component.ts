import { Component, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
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
import { MatExpansionModule } from '@angular/material/expansion';
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
import { ConnectorUtils } from '../../../shared/utils/connector.utils';
import { SortByConnectorIdPipe } from '../../../shared/pipes';

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
    MatExpansionModule,
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
  
  // Loading states
  protected readonly translationsLoading = signal(true);
  protected readonly initializing = signal(true);
  
  // Subscription management
  private authSubscription?: Subscription;
  private websocketSubscription?: Subscription;
  private authCheckTimeout?: any;
  private isProcessingUpdate = false;

  constructor() {
    // Set up effect to react to charge point updates for this specific station
    effect(() => {
      const update = this.websocketService.chargePointUpdate();
      const currentStation = this.stationDetail();
      
      // Only process if we have an update, a current station, and we're not already processing
      if (update && currentStation && update.chargePointId === currentStation.charge_point_id && !this.isProcessingUpdate) {
        this.isProcessingUpdate = true;
        
        // Clear the update signal immediately to prevent re-triggering
        this.websocketService.clearChargePointUpdate();
        
        // Only reload if not already loading to prevent infinite loops
        if (!this.loading()) {
          this.loadStationDetail();
        }
        
        // Highlight updated connector if connector_id is present
        if (update.connectorId) {
          this.highlightConnector(update.connectorId);
        }
        
        // Set real-time indicator and allow processing again after timeout
        this.realtimeActive.set(true);
        setTimeout(() => {
          this.realtimeActive.set(false);
          this.isProcessingUpdate = false;
        }, 2000);
      } else if (!update) {
        // If no update, allow processing again
        this.isProcessingUpdate = false;
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
            // Set initializing to false once we start loading data
            this.initializing.set(false);
          }
        });
      } else {
        // Give Firebase auth time to restore session on page reload
        // Only redirect after a short delay to avoid premature redirects
        this.authCheckTimeout = setTimeout(() => {
          this.initializing.set(false);
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
        },
        error: (error) => {
          // Error loading station detail - handled by service
        }
      });
    }
  }
  
  /**
   * Initialize WebSocket listening for charge-point events.
   * We rely on the reactive chargePointUpdate signal (effect in constructor)
   * and avoid direct stage subscriptions to prevent duplicate refreshes.
   */
  private initializeWebSocketSubscriptions(): void {
    // Send listen command; global WebSocket pipeline will emit into chargePointUpdate signal
    this.websocketService.sendCommand(WsCommand.ListenChargePoints).catch(error => {
      console.error('[StationDetail] Failed to subscribe to charge points:', error);
    });
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
    const availableConnectors = station.connectors.filter(c => ConnectorUtils.isAvailable(c.status)).length;
    return availableConnectors > 0 ? 'check_circle' : 'warning';
  }

  getStatusIconClass(): string {
    const station = this.stationDetail();
    if (!station) return '';
    if (!station.is_online) return 'status-offline';
    const availableConnectors = station.connectors.filter(c => ConnectorUtils.isAvailable(c.status)).length;
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
    return station.connectors.some(connector => ConnectorUtils.isAvailable(connector.status));
  }

  isAvailable(status: string): boolean {
    return ConnectorUtils.isAvailable(status);
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
