import { Component, signal, inject, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChargePointService } from '../../core/services/chargepoint.service';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { UserInfoService } from '../../core/services/user-info.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { ChargePoint, ChargePointConnector } from '../../core/models/chargepoint.model';
import { Transaction } from '../../core/models/transaction.model';
import { TransactionDetail } from '../../core/models/transaction-detail.model';
import { WsCommand, WsResponse, ResponseStage } from '../../core/models/websocket.model';
import { TransactionPreviewComponent } from '../../shared/components/transaction-preview/transaction-preview.component';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';
import { ConnectorUtils } from '../../shared/utils/connector.utils';

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule,
    SortByConnectorIdPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected readonly chargePointService = inject(ChargePointService);
  protected readonly authService = inject(AuthService);
  protected readonly transactionService = inject(TransactionService);
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly websocketService = inject(WebsocketService);
  private readonly userInfoService = inject(UserInfoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Real-time updates
  protected readonly realtimeActive = signal(false);
  
  // Subscription management
  private authSubscription?: Subscription;
  private websocketSubscription?: Subscription;
  
  protected readonly totalSessions = signal(24);
  protected readonly totalEnergy = signal(156.8);
  protected readonly totalCost = signal(89.50); // This will be calculated from actual transactions
  
  
  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();
    
    // Wait for authentication before loading data
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.loadChargePoints();
        this.loadRecentChargePoints();
        this.loadTransactions();
        this.loadActiveTransactions();
        this.loadUserInfo();
        this.initializeWebSocketSubscriptions();
      }
    });
  }
  
  /**
   * Initialize WebSocket subscriptions for real-time updates
   * Note: WebSocket is already connected globally
   */
  private initializeWebSocketSubscriptions(): void {
    // Subscribe to charge-point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints).catch(error => {
      console.error('[Dashboard] Failed to subscribe to charge points:', error);
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
    // Parse charge point ID from message.data
    const chargePointId = message.data;
    
    if (!chargePointId) {
      return;
    }
    
    // Refresh charge points data
    this.chargePointService.refreshChargePoints().subscribe({
      next: () => {
        // Data refreshed successfully
      },
      error: (error) => {
        console.error('[Dashboard] Failed to refresh charge points:', error);
      }
    });
    
    // Set real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000); // Flash indicator for 2 seconds
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    
    if (this.websocketSubscription) {
      this.websocketSubscription.unsubscribe();
    }
  }
  
  protected recentChargePoints(): ChargePoint[] {
    return this.transactionService.getRecentChargePoints();
  }
  
  protected recentTransactions(): Transaction[] {
    return this.transactionService.getRecentTransactions();
  }

  protected activeTransactions(): TransactionDetail[] {
    return this.transactionService.activeTransactions();
  }

  protected hasActiveTransactions(): boolean {
    const active = this.activeTransactions();
    return active && active.length > 0;
  }
  
  protected getAvailableConnectors(chargePoint: ChargePoint): number {
    return chargePoint.connectors.filter(conn => ConnectorUtils.isAvailable(conn.status)).length;
  }

  protected isAvailable(status: string): boolean {
    return ConnectorUtils.isAvailable(status);
  }

  protected getConnectorStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'available';
      case 'occupied':
      case 'charging':
        return 'occupied';
      case 'out_of_order':
      case 'faulted':
        return 'out_of_order';
      case 'reserved':
        return 'reserved';
      default:
        return 'unknown';
    }
  }

  protected getConnectorTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'type1':
      case 'type_1':
        return 'electrical_services';
      case 'type2':
      case 'type_2':
        return 'power';
      case 'ccs':
        return 'battery_charging_full';
      case 'chademo':
        return 'battery_charging_full';
      case 'tesla':
        return 'electric_car';
      default:
        return 'power';
    }
  }
  
  protected refreshChargePoints(): void {
    this.chargePointService.clearError();
    this.loadChargePoints();
  }

  protected refreshRecentChargePoints(): void {
    this.transactionService.clearError();
    this.loadRecentChargePoints();
  }
  
  protected refreshTransactions(): void {
    this.transactionService.clearError();
    this.loadTransactions();
    this.loadActiveTransactions();
  }

  protected navigateToActiveTransactions(): void {
    this.router.navigate(['/sessions/active']);
  }

  protected openTransactionPreview(transaction: Transaction): void {
    this.dialog.open(TransactionPreviewComponent, {
      data: { transactionId: transaction.transaction_id },
      width: '90vw',
      maxWidth: '800px',
      autoFocus: false,
      restoreFocus: false
    });
  }

  protected startChargingSession(chargePoint: ChargePoint): void {
    if (chargePoint.is_enabled && ConnectorUtils.isAvailable(chargePoint.status)) {
      // Navigate to station detail or start charging flow
      // TODO: Implement charging session start logic
    }
  }

  protected canStartCharge(chargePoint: ChargePoint): boolean {
    return chargePoint.is_online && 
           chargePoint.is_enabled && 
           this.getAvailableConnectors(chargePoint) > 0;
  }

  protected getStartChargeTooltip(chargePoint: ChargePoint): string {
    if (!chargePoint.is_online) {
      return this.translationService.get('dashboard.tooltips.stationOffline');
    }
    if (!chargePoint.is_enabled) {
      return this.translationService.get('dashboard.tooltips.stationDisabled');
    }
    if (this.getAvailableConnectors(chargePoint) === 0) {
      return this.translationService.get('dashboard.tooltips.noAvailableConnectors');
    }
    return this.translationService.get('dashboard.tooltips.startCharging');
  }

  protected startCharge(stationId: string): void {
    // Navigate to charge initiation screen
    this.router.navigate(['/stations', stationId, 'charge']);
  }
  
  private loadChargePoints(): void {
    this.chargePointService.loadChargePoints().subscribe({
      next: (chargePoints) => {
        // Charge points loaded successfully
      },
      error: (error) => {
        // Error loading charge points - handled by service
      }
    });
  }

  private loadRecentChargePoints(): void {
    this.transactionService.loadRecentChargePoints().subscribe({
      next: (chargePoints) => {
        // Recent charge points loaded successfully
      },
      error: (error) => {
        // Error loading recent charge points - handled by service
      }
    });
  }
  
  private loadTransactions(): void {
    this.transactionService.loadTransactions().subscribe({
      next: (transactions) => {
        // Transactions loaded successfully
      },
      error: (error) => {
        // Error loading transactions - handled by service
      }
    });
  }

  private loadActiveTransactions(): void {
    this.transactionService.loadActiveTransactions().subscribe({
      next: (activeTransactions) => {
        // Active transactions loaded successfully
      },
      error: (error) => {
        // Error loading active transactions - handled by service
        // Don't show error if there are simply no active transactions
      }
    });
  }
  
  protected formatEnergy(meterStart: number, meterStop: number): string {
    const energy = (meterStop - meterStart) / 1000; // Convert from Wh to kWh
    return energy.toFixed(2);
  }

  protected formatActiveTransactionEnergy(consumed: number): string {
    // Convert from Wh to kWh
    const energyInKwh = consumed / 1000;
    return energyInKwh.toFixed(2);
  }

  protected formatActiveTransactionDuration(duration: number): string {
    // duration is in seconds
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  protected formatActiveTransactionPowerRate(powerRate: number): string {
    // Convert from Watts to kW
    const powerInKw = powerRate / 1000;
    return powerInKw.toFixed(1);
  }
  
  protected formatDuration(timeStart: string, timeStop: string): string {
    const start = new Date(timeStart);
    const stop = new Date(timeStop);
    const durationMs = stop.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  protected formatTransactionTime(timeStart: string): string {
    const date = new Date(timeStart);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      const key = diffDays > 1 ? 'dashboard.timeFormat.daysAgo_plural' : 'dashboard.timeFormat.daysAgo';
      return this.translationService.get(key).replace('{{count}}', diffDays.toString());
    } else if (diffHours > 0) {
      const key = diffHours > 1 ? 'dashboard.timeFormat.hoursAgo_plural' : 'dashboard.timeFormat.hoursAgo';
      return this.translationService.get(key).replace('{{count}}', diffHours.toString());
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const key = diffMinutes !== 1 ? 'dashboard.timeFormat.minutesAgo_plural' : 'dashboard.timeFormat.minutesAgo';
      return this.translationService.get(key).replace('{{count}}', diffMinutes.toString());
    }
  }

  protected formatTransactionDateTime(timeStart: string): string {
    const date = new Date(timeStart);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected hasViewDetailsAccess(): boolean {
    return this.userInfoService.getAccessLevel() >= 5;
  }

  protected getViewDetailsTooltip(chargePoint: ChargePoint): string {
    if (!this.hasViewDetailsAccess()) {
      return this.translationService.get('stations.tooltips.accessRequired');
    }
    return this.translationService.get('stations.tooltips.viewDetails');
  }

  protected viewStationDetails(stationId: string): void {
    this.router.navigate(['/stations', stationId]);
  }

  protected onCardClick(stationId: string): void {
    if (this.hasViewDetailsAccess()) {
      this.viewStationDetails(stationId);
    }
  }

  private loadUserInfo(): void {
    this.userInfoService.loadCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // User info loaded successfully
      },
      error: (error) => {
        // Failed to load user info - handled by service
      }
    });
  }
}
