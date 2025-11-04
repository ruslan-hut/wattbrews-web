import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Transaction } from '../models/transaction.model';
import { TransactionDetail } from '../models/transaction-detail.model';
import { ChargePoint } from '../models/chargepoint.model';
// TODO: Uncomment when implementing real-time transaction monitoring
// import { WebsocketService } from './websocket.service';
// import { WsCommand, WsResponse, ResponseStatus } from '../models/websocket.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiService = inject(ApiService);
  // TODO: Uncomment when implementing real-time transaction monitoring
  // private readonly websocketService = inject(WebsocketService);
  
  // Signals for state management
  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _activeTransactions = signal<TransactionDetail[]>([]);
  private readonly _recentChargePoints = signal<ChargePoint[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Real-time transaction metrics
  // TODO: Uncomment when implementing active session component
  // private readonly _activeTransactionMetrics = signal<{
  //   power: number;
  //   powerRate: number;
  //   soc: number;
  //   price: number;
  //   duration: number;
  //   status: string;
  // } | null>(null);
  // readonly activeTransactionMetrics = this._activeTransactionMetrics.asReadonly();
  
  // Public readonly signals
  readonly transactions = this._transactions.asReadonly();
  readonly activeTransactions = this._activeTransactions.asReadonly();
  readonly recentChargePoints = this._recentChargePoints.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  /**
   * Load user transactions from the API
   */
  loadTransactions(): Observable<Transaction[]> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.apiService.getArray<Transaction>('/transactions/list').pipe(
      tap(transactions => {
        this._transactions.set(transactions);
        this._loading.set(false);
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to load transactions');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Load recent charge points from the API
   */
  loadRecentChargePoints(): Observable<ChargePoint[]> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.apiService.getArray<ChargePoint>('/transactions/recent').pipe(
      tap(chargePoints => {
        this._recentChargePoints.set(chargePoints);
        this._loading.set(false);
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to load recent charge points');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Load user transactions for a specific time period
   */
  loadTransactionsByTimeRange(startTimestamp: number, endTimestamp: number): Observable<Transaction[]> {
    this._loading.set(true);
    this._error.set(null);
    
    const endpoint = `/transactions/list/${startTimestamp}-${endTimestamp}`;
    
    return this.apiService.getArray<Transaction>(endpoint).pipe(
      tap(transactions => {
        this._transactions.set(transactions);
        this._loading.set(false);
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to load transactions for selected period');
        this._loading.set(false);
        throw error;
      })
    );
  }
  
  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
  
  /**
   * Get recent transactions (last 3)
   */
  getRecentTransactions(): Transaction[] {
    return this._transactions().slice(0, 3);
  }

  /**
   * Get recent charge points
   */
  getRecentChargePoints(): ChargePoint[] {
    return this._recentChargePoints();
  }
  
  /**
   * Get finished transactions only
   */
  getFinishedTransactions(): Transaction[] {
    return this._transactions().filter(transaction => transaction.is_finished);
  }
  
  /**
   * Get transaction by ID
   */
  getTransactionById(transactionId: number): Transaction | undefined {
    return this._transactions().find(t => t.transaction_id === transactionId);
  }

  /**
   * Load detailed transaction information by ID
   */
  loadTransactionDetail(transactionId: number): Observable<TransactionDetail> {
    return this.apiService.getDirect<TransactionDetail>(`/transactions/info/${transactionId}`).pipe(
      tap(transactionDetail => {
        // Transaction detail loaded successfully
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Load active transactions from the API
   */
  loadActiveTransactions(): Observable<TransactionDetail[]> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.apiService.getArray<TransactionDetail>('/transactions/active').pipe(
      tap(activeTransactions => {
        this._activeTransactions.set(activeTransactions);
        this._loading.set(false);
      }),
      catchError(error => {
        this._error.set(error.message || 'Failed to load active transactions');
        this._loading.set(false);
        throw error;
      })
    );
  }

  // ============================================================================
  // Real-Time Transaction Monitoring Methods (Future Implementation)
  // ============================================================================
  
  /**
   * Start listening to real-time updates for a transaction
   * TODO: Implement when active session component is created
   * 
   * @param transactionId - The transaction ID to monitor
   * 
   * Usage example:
   * ```typescript
   * ngOnInit() {
   *   const transactionId = this.route.snapshot.params['id'];
   *   this.transactionService.listenToTransaction(transactionId);
   * }
   * ```
   */
  listenToTransaction(transactionId: number): void {
    // TODO: Implement WebSocket subscription for transaction updates
    // this.websocketService.sendCommand(WsCommand.ListenTransaction, { transaction_id: transactionId });
    
    // TODO: Subscribe to value updates
    // this.websocketService.subscribeToStatus(ResponseStatus.Value, (message) => {
    //   if (message.id === transactionId) {
    //     this.updateTransactionMetrics(message);
    //   }
    // });
    
    console.log(`[TransactionService] TODO: Implement listenToTransaction for transaction ${transactionId}`);
  }

  /**
   * Stop listening to transaction updates
   * TODO: Implement when active session component is created
   * 
   * @param transactionId - The transaction ID to stop monitoring
   * 
   * Usage example:
   * ```typescript
   * ngOnDestroy() {
   *   this.transactionService.stopListeningToTransaction(this.transactionId);
   * }
   * ```
   */
  stopListeningToTransaction(transactionId: number): void {
    // TODO: Implement WebSocket unsubscribe
    // this.websocketService.sendCommand(WsCommand.StopListenTransaction, { transaction_id: transactionId });
    
    console.log(`[TransactionService] TODO: Implement stopListeningToTransaction for transaction ${transactionId}`);
  }

  /**
   * Update transaction metrics from WebSocket message
   * TODO: Implement when active session component is created
   * 
   * Updates the following real-time metrics:
   * - power (in kW)
   * - power_rate (in kW)
   * - soc (state of charge %)
   * - price (in currency)
   * - minute (duration in minutes)
   * - connector_status
   * 
   * @param message - WebSocket message containing transaction metrics
   */
  private updateTransactionMetrics(message: any): void {
    // TODO: Implement metrics update
    // this._activeTransactionMetrics.set({
    //   power: message.power || 0,
    //   powerRate: message.power_rate || 0,
    //   soc: message.soc || 0,
    //   price: message.price || 0,
    //   duration: message.minute || 0,
    //   status: message.connector_status || 'Unknown'
    // });
    
    console.log('[TransactionService] TODO: Implement updateTransactionMetrics', message);
  }
}
