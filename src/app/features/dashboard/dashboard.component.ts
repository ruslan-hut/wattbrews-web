import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { ChargePointService } from '../../core/services/chargepoint.service';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ChargePoint } from '../../core/models/chargepoint.model';
import { Transaction } from '../../core/models/transaction.model';
import { TransactionPreviewComponent } from '../../shared/components/transaction-preview/transaction-preview.component';

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
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .dashboard-subtitle {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .dashboard-card {
      height: fit-content;
    }
    
    .quick-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .quick-actions button {
      flex: 1;
      min-width: 150px;
    }
    
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .transaction-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .transaction-item:hover {
      border-color: #2196f3;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
      transform: translateY(-1px);
    }
    
    .transaction-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f5f5f5;
    }
    
    .transaction-icon mat-icon {
      font-size: 20px;
    }
    
    .transaction-icon .finished {
      color: #4caf50;
    }
    
    .transaction-icon .pending {
      color: #ff9800;
    }
    
    .transaction-content {
      flex: 1;
    }
    
    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    
    .transaction-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }
    
    .transaction-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .transaction-status.finished {
      background-color: #e8f5e8;
      color: #4caf50;
    }
    
    .transaction-status.pending {
      background-color: #fff3e0;
      color: #ff9800;
    }
    
    .transaction-details {
      margin-bottom: 8px;
    }
    
    .transaction-details p {
      margin: 4px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .transaction-energy {
      font-weight: 500;
      color: #333 !important;
    }
    
    .transaction-payment {
      display: flex;
      justify-content: flex-end;
    }
    
    .payment-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: #4caf50;
    }
    
    .no-transactions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px 20px;
      text-align: center;
    }
    
    .no-data-icon {
      font-size: 3rem;
      color: #ccc;
    }
    
    .no-transactions p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .stat-icon {
      color: #2196f3;
      font-size: 2rem;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #666;
    }
    
    .nearby-stations {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .station-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .station-info {
      flex: 1;
    }
    
    .station-name {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .station-address {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .station-distance {
      font-size: 0.8rem;
      color: #999;
    }
    
    .station-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      background-color: #f44336;
      color: white;
    }
    
    .station-status.available {
      background-color: #4caf50;
    }
    
    .view-all-button {
      width: 100%;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
      text-align: center;
    }
    
    .error-icon {
      color: #f44336;
      font-size: 3rem;
    }
    
    .charge-points-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .charge-point-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: box-shadow 0.2s;
    }
    
    .charge-point-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .charge-point-info {
      flex: 1;
    }
    
    .charge-point-title {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
    }
    
    .charge-point-address {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .charge-point-details {
      margin-bottom: 8px;
    }
    
    .connectors-info {
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      color: #666;
    }
    
    .charge-point-actions {
      display: flex;
      align-items: center;
    }
    
    .mat-chip.online {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.offline {
      background-color: #f44336;
      color: white;
    }
    
    .mat-chip.available {
      background-color: #4caf50;
      color: white;
    }
    
    .mat-chip.busy {
      background-color: #ff9800;
      color: white;
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 10px;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .quick-actions {
        flex-direction: column;
      }
      
      .quick-actions button {
        min-width: auto;
      }
      
      .charge-point-item {
        flex-direction: column;
        gap: 12px;
      }
      
      .charge-point-actions {
        align-self: flex-end;
      }
      
      .transaction-item {
        flex-direction: column;
        gap: 12px;
      }
      
      .transaction-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
      
      .transaction-status {
        align-self: flex-start;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  protected readonly chargePointService = inject(ChargePointService);
  protected readonly authService = inject(AuthService);
  protected readonly transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);
  
  protected readonly totalSessions = signal(24);
  protected readonly totalEnergy = signal(156.8);
  protected readonly totalCost = signal(89.50);
  
  
  ngOnInit(): void {
    // Wait for authentication before loading data
    this.authService.user$.subscribe(user => {
      if (user) {
        console.log('User authenticated, loading data');
        this.loadChargePoints();
        this.loadTransactions();
      } else {
        console.log('User not authenticated, skipping data load');
      }
    });
  }
  
  protected recentChargePoints(): ChargePoint[] {
    return this.chargePointService.chargePoints().slice(0, 5);
  }
  
  protected recentTransactions(): Transaction[] {
    return this.transactionService.getRecentTransactions();
  }
  
  protected getAvailableConnectors(chargePoint: ChargePoint): number {
    return chargePoint.connectors.filter(conn => conn.status === 'Available').length;
  }
  
  protected refreshChargePoints(): void {
    this.chargePointService.clearError();
    this.loadChargePoints();
  }
  
  protected refreshTransactions(): void {
    this.transactionService.clearError();
    this.loadTransactions();
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
  
  private loadChargePoints(): void {
    console.log('Attempting to load charge points...');
    this.chargePointService.loadChargePoints().subscribe({
      next: (chargePoints) => {
        console.log('Charge points loaded successfully:', chargePoints);
      },
      error: (error) => {
        console.error('Error loading charge points:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
      }
    });
  }
  
  private loadTransactions(): void {
    console.log('Attempting to load transactions...');
    this.transactionService.loadTransactions().subscribe({
      next: (transactions) => {
        console.log('Transactions loaded successfully:', transactions);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
      }
    });
  }
  
  protected formatEnergy(meterStart: number, meterStop: number): string {
    const energy = (meterStop - meterStart) / 1000; // Convert from Wh to kWh
    return energy.toFixed(2);
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
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  }
}
