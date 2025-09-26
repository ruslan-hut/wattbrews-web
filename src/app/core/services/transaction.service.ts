import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Transaction } from '../models/transaction.model';
import { TransactionDetail } from '../models/transaction-detail.model';
import { ChargePoint } from '../models/chargepoint.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly apiService = inject(ApiService);
  
  // Signals for state management
  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _recentChargePoints = signal<ChargePoint[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Public readonly signals
  readonly transactions = this._transactions.asReadonly();
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
        console.log('Transactions loaded successfully:', transactions);
        this._transactions.set(transactions);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading transactions:', error);
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
        console.log('Recent charge points loaded successfully:', chargePoints);
        this._recentChargePoints.set(chargePoints);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading recent charge points:', error);
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
    console.log('Loading transactions for time range:', { startTimestamp, endTimestamp, endpoint });
    
    return this.apiService.getArray<Transaction>(endpoint).pipe(
      tap(transactions => {
        console.log('Transactions loaded successfully for time range:', transactions);
        this._transactions.set(transactions);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading transactions for time range:', error);
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
   * Get recent transactions (last 5)
   */
  getRecentTransactions(): Transaction[] {
    return this._transactions().slice(0, 5);
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
    console.log('Loading transaction detail for ID:', transactionId);
    
    return this.apiService.getDirect<TransactionDetail>(`/transactions/info/${transactionId}`).pipe(
      tap(transactionDetail => {
        console.log('Transaction detail loaded successfully:', transactionDetail);
      }),
      catchError(error => {
        console.error('Error loading transaction detail:', error);
        throw error;
      })
    );
  }
}
