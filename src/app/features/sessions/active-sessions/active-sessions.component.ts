import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDetail } from '../../../core/models/transaction-detail.model';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { WsCommand, WsResponse, ResponseStatus } from '../../../core/models/websocket.model';
import { EnergyChartComponent } from '../../../shared/components/energy-chart/energy-chart.component';
import { SmallMapComponent } from '../../../shared/components/small-map/small-map.component';

@Component({
  selector: 'app-active-sessions',
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
    EnergyChartComponent,
    SmallMapComponent
  ],
  templateUrl: './active-sessions.component.html',
  styleUrl: './active-sessions.component.scss'
})
export class ActiveSessionsComponent implements OnInit, OnDestroy {
  protected readonly transactionService = inject(TransactionService);
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly authService = inject(AuthService);
  protected readonly websocketService = inject(WebsocketService);
  private readonly router = inject(Router);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Authentication state
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly authLoading = signal(true);
  
  // Active transactions state
  protected readonly activeTransactions = signal<TransactionDetail[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Real-time updates
  protected readonly realtimeActive = signal(false);
  
  // Subscription management
  private authSubscription?: Subscription;
  private apiSubscription?: Subscription;
  private wsUnsubscribe?: () => void;
  private authCheckTimeout?: any;

  ngOnInit(): void {
    // Initialize translations first, regardless of auth state
    this.initializeTranslations();
    
    // Subscribe to auth state changes with timeout to handle page reload
    this.authSubscription = this.authService.user$.subscribe(async user => {
      if (user) {
        this.authLoading.set(false);
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout);
        }
        
        // Load active transactions after authentication
        this.loadActiveTransactions();
        
        // Initialize WebSocket subscriptions for real-time updates
        this.initializeWebSocketSubscriptions();
      } else {
        // Give Firebase auth time to restore session on page reload
        this.authCheckTimeout = setTimeout(() => {
          this.authLoading.set(false);
        }, 1000); // 1 second delay
      }
    });
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      
      // Verify translations are actually loaded
      if (!this.translationService.areTranslationsLoaded()) {
        throw new Error('Translations not available after initialization');
      }
      
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }

  /**
   * Initialize WebSocket subscriptions for real-time updates
   * Note: WebSocket is already connected globally
   */
  private initializeWebSocketSubscriptions(): void {
    // Subscribe to transaction value updates for real-time metrics
    this.wsUnsubscribe = this.websocketService.subscribeToStatus(
      ResponseStatus.Value,
      (message) => {
        this.handleTransactionValueUpdate(message);
      }
    );
  }

  /**
   * Handle transaction value update from WebSocket
   * Updates transaction metrics in real-time
   */
  private handleTransactionValueUpdate(message: WsResponse): void {
    // Only handle messages with transaction ID
    if (!message.id) {
      return;
    }
    
    const transactionId = message.id;
    const currentTransactions = this.activeTransactions();
    
    // Find and update the transaction
    const transactionIndex = currentTransactions.findIndex(
      t => t.transaction_id === transactionId
    );
    
    if (transactionIndex === -1) {
      // Transaction not in current list, might be a new active transaction
      // Refresh the list to get the latest state
      this.refreshTransactions();
      return;
    }
    
    // Update the transaction with new metrics
    const updatedTransactions = [...currentTransactions];
    const transaction = { ...updatedTransactions[transactionIndex] };
    
    // Update transaction metrics from WebSocket message
    if (message.power_rate !== undefined) {
      transaction.power_rate = message.power_rate;
    }
    
    if (message.price !== undefined) {
      transaction.price = message.price;
    }
    
    if (message.minute !== undefined) {
      // Convert minutes to seconds for duration
      transaction.duration = message.minute * 60;
    }
    
    if (message.connector_status) {
      transaction.status = message.connector_status;
      transaction.is_charging = message.connector_status.toLowerCase() === 'charging';
    }
    
    // Update consumed energy if provided
    if (message.meter_value?.value !== undefined) {
      // Calculate consumed from meter value
      const meterStart = transaction.meter_start || 0;
      transaction.consumed = message.meter_value.value - meterStart;
    }
    
    // Update meter values if provided
    if (message.meter_value) {
      const existingMeterValues = transaction.meter_values || [];
      const newMeterValue = {
        transaction_id: transactionId,
        value: message.meter_value.value || 0,
        power_rate: message.power_rate || 0,
        battery_level: message.soc || 0,
        consumed_energy: message.meter_value.value ? message.meter_value.value - (transaction.meter_start || 0) : 0,
        price: message.price || 0,
        time: new Date().toISOString(),
        timestamp: Date.now(),
        minute: message.minute || 0,
        unit: message.meter_value.unit || 'Wh',
        measurand: message.meter_value.measurand || 'Energy.Active.Import.Register',
        connector_id: message.connector_id || transaction.connector_id,
        connector_status: message.connector_status || transaction.status
      };
      
      // Add new meter value (avoid duplicates by checking timestamp)
      const lastMeterValue = existingMeterValues[existingMeterValues.length - 1];
      if (!lastMeterValue || 
          new Date(newMeterValue.time).getTime() > new Date(lastMeterValue.time).getTime()) {
        transaction.meter_values = [...existingMeterValues, newMeterValue];
      }
    }
    
    updatedTransactions[transactionIndex] = transaction;
    this.activeTransactions.set(updatedTransactions);
    
    // Show real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000);
  }

  private loadActiveTransactions(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.apiSubscription = this.transactionService.loadActiveTransactions().subscribe({
      next: (transactions) => {
        this.activeTransactions.set(transactions);
        this.loading.set(false);
        
        // Start listening to each active transaction for real-time updates
        this.startListeningToTransactions(transactions);
      },
      error: (error) => {
        this.error.set(error.message || 'Failed to load active transactions');
        this.loading.set(false);
      }
    });
  }

  /**
   * Start listening to each active transaction via WebSocket
   */
  private startListeningToTransactions(transactions: TransactionDetail[]): void {
    // Send listen command for each active transaction
    transactions.forEach(transaction => {
      this.websocketService.sendCommand(
        WsCommand.ListenTransaction,
        { transaction_id: transaction.transaction_id }
      ).catch(error => {
        console.error(`[ActiveSessions] Failed to listen to transaction ${transaction.transaction_id}:`, error);
      });
    });
  }

  protected refreshTransactions(): void {
    this.transactionService.clearError();
    this.loadActiveTransactions();
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions and timeout
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.apiSubscription) {
      this.apiSubscription.unsubscribe();
    }
    if (this.wsUnsubscribe) {
      this.wsUnsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
    
    // Stop listening to all transactions
    const transactions = this.activeTransactions();
    transactions.forEach(transaction => {
      this.websocketService.sendCommand(
        WsCommand.StopListenTransaction,
        { transaction_id: transaction.transaction_id }
      ).catch(error => {
        console.error(`[ActiveSessions] Failed to stop listening to transaction ${transaction.transaction_id}:`, error);
      });
    });
  }

  protected formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  protected formatEnergy(wh: number): string {
    return (wh / 1000).toFixed(2);
  }

  protected formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  protected calculateAveragePower(consumed: number, durationSeconds: number): string {
    if (!consumed || !durationSeconds || durationSeconds === 0) {
      return '0 W';
    }
    
    // Convert consumed energy from Wh to W and duration from seconds to hours
    // Power (W) = Energy (Wh) / Time (h)
    const energyWh = consumed;
    const durationHours = durationSeconds / 3600;
    
    const powerInWatts = energyWh / durationHours;
    
    // Return in kW if >= 1000 W, otherwise in W
    if (powerInWatts >= 1000) {
      const powerInKw = powerInWatts / 1000;
      return `${powerInKw.toFixed(1)} kW`;
    } else {
      return `${powerInWatts.toFixed(0)} W`;
    }
  }

  protected hasMeterValues(transaction: TransactionDetail): boolean {
    return !!(transaction.meter_values && transaction.meter_values.length > 0);
  }

  protected hasLocation(transaction: TransactionDetail): boolean {
    // Check if location exists in transaction (API might not include it in active transactions)
    return false; // Active transactions API response doesn't include location in the example
  }

  protected getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'charging':
        return 'charging';
      case 'finished':
      case 'completed':
        return 'completed';
      case 'stopped':
        return 'stopped';
      default:
        return 'unknown';
    }
  }

  protected getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'charging':
        return 'battery_charging_full';
      case 'finished':
      case 'completed':
        return 'check_circle';
      case 'stopped':
        return 'stop_circle';
      default:
        return 'help';
    }
  }
}
