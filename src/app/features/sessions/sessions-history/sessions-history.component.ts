import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { Transaction } from '../../../core/models/transaction.model';
import { TransactionPreviewComponent } from '../../../shared/components/transaction-preview/transaction-preview.component';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-sessions-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './sessions-history.component.html',
  styles: [`
    .sessions-history-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .page-header {
      margin-bottom: 24px;
      text-align: center;
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
    
    .filters-section {
      margin-bottom: 24px;
    }
    
    .filters-card {
      padding: 20px;
      background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
      border: 1px solid #dadce0;
    }
    
    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    
    .search-field {
      flex: 1;
      min-width: 300px;
    }
    
    .month-filter-field {
      min-width: 220px;
    }
    
    .clear-month-button {
      color: #5a6c7d;
    }
    
    .clear-month-button:hover {
      color: #f44336;
    }
    
    .transactions-section {
      margin-bottom: 24px;
    }
    
    .transactions-card {
      padding: 0;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #ced4da;
    }
    
    .card-header {
      padding: 20px 20px 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .card-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0;
      color: #2c3e50;
    }
    
    .refresh-button {
      margin-left: auto;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      text-align: center;
    }
    
    .error-icon {
      color: #f44336;
      font-size: 3rem;
    }
    
    .transactions-table {
      width: 100%;
    }
    
    .transaction-row {
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .transaction-row:hover {
      background-color: rgba(255, 255, 255, 0.8);
    }
    
    .status-chip {
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .status-chip.completed {
      background-color: #e8f5e8;
      color: #4caf50;
    }
    
    .status-chip.in-progress {
      background-color: #fff3e0;
      color: #ff9800;
    }
    
    .energy-value {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .payment-amount {
      font-weight: 600;
      color: #4caf50;
    }
    
    .no-transactions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 60px 20px;
      text-align: center;
    }
    
    .no-data-icon {
      font-size: 4rem;
      color: #ccc;
    }
    
    .no-transactions h3 {
      margin: 0;
      color: #5a6c7d;
      font-weight: 400;
    }
    
    .no-transactions p {
      margin: 0;
      color: #adb5bd;
    }
    
    .stats-row {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .stat-card {
      flex: 1;
      min-width: 200px;
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      border: 1px solid #ced4da;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 500;
      color: #2c3e50;
      margin: 0;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: #5a6c7d;
      margin: 4px 0 0 0;
    }
    
    .stat-icon {
      color: #6c757d;
      font-size: 1.8rem;
      margin-bottom: 8px;
    }
    
    @media (max-width: 480px) {
      .sessions-history-container {
        padding: 4px;
      }
      
      .page-title {
        font-size: 1.3rem;
      }
      
      .page-subtitle {
        font-size: 0.85rem;
      }
      
      .mobile-transaction-card {
        padding: 12px;
        margin-bottom: 8px;
      }
      
      .mobile-transaction-header {
        margin-bottom: 8px;
      }
      
      .mobile-transaction-id {
        font-size: 0.9rem;
      }
      
      .mobile-detail-row {
        padding: 3px 0;
      }
      
      .mobile-detail-label {
        font-size: 0.8rem;
      }
      
      .mobile-detail-value {
        font-size: 0.85rem;
        max-width: 65%;
      }
      
      .stat-value {
        font-size: 1.3rem;
      }
      
      .stat-icon {
        font-size: 1.5rem;
      }
    }
    
    @media (max-width: 900px) {
      .transactions-table {
        display: none !important;
      }
      
      .mobile-transactions {
        display: block !important;
        background-color: #f8f9fa;
        padding: 8px;
        border-radius: 8px;
      }
    }
    
    @media (max-width: 768px) {
      .sessions-history-container {
        padding: 8px;
      }
      
      .page-title {
        font-size: 1.5rem;
        margin-bottom: 4px;
      }
      
      .page-subtitle {
        font-size: 0.9rem;
        margin-bottom: 16px;
      }
      
      .filters-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
      
      .search-field,
      .month-filter-field {
        min-width: auto;
        width: 100%;
      }
      
      .stats-row {
        flex-direction: column;
        gap: 12px;
      }
      
      .stat-card {
        min-width: auto;
      }
      
      .stat-value {
        font-size: 1.5rem;
      }
      
      .stat-icon {
        font-size: 1.6rem;
      }
      
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 16px 0 16px;
      }
      
      .refresh-button {
        margin-left: 0;
        align-self: flex-end;
      }
      
      .transactions-table {
        display: none !important;
      }
      
      .mobile-transactions {
        display: block !important;
        background-color: #f8f9fa;
        padding: 8px;
        border-radius: 8px;
      }
      
      .mobile-transaction-card {
        display: block;
        margin-bottom: 12px;
        padding: 16px;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
      }
      
      .mobile-transaction-card:active {
        transform: scale(0.98);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      .mobile-transaction-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      .mobile-transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      
      .mobile-transaction-id {
        font-weight: 600;
        color: #2c3e50;
        font-size: 1rem;
      }
      
      .mobile-transaction-status {
        margin-left: 8px;
      }
      
      .mobile-transaction-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .mobile-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
      }
      
      .mobile-detail-label {
        font-size: 0.85rem;
        color: #5a6c7d;
        font-weight: 500;
      }
      
      .mobile-detail-value {
        font-size: 0.9rem;
        color: #2c3e50;
        text-align: right;
        max-width: 60%;
        word-break: break-word;
      }
      
      .mobile-detail-value.energy {
        font-weight: 600;
        color: #2196f3;
      }
      
      .mobile-detail-value.payment {
        font-weight: 600;
        color: #4caf50;
      }
      
      .mobile-transaction-time {
        font-size: 0.8rem;
        color: #999;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
      }
      
      .no-transactions {
        padding: 40px 16px;
      }
      
      .no-data-icon {
        font-size: 3rem;
      }
      
      .no-transactions h3 {
        font-size: 1.1rem;
      }
      
      .no-transactions p {
        font-size: 0.9rem;
      }
    }
    
    @media (min-width: 769px) {
      .mobile-transactions {
        display: none;
      }
      
      .transactions-table {
        display: table;
      }
    }
    
    .mobile-transactions {
      display: none;
    }
    
    .transactions-table {
      display: table;
    }
  `]
})
export class SessionsHistoryComponent implements OnInit, OnDestroy {
  protected readonly transactionService = inject(TransactionService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Subscription management
  private authSubscription?: Subscription;
  private authCheckTimeout?: any;
  
  // Table configuration
  protected readonly displayedColumns = [
    'transaction_id',
    'status', 
    'station',
    'energy',
    'duration',
    'payment',
    'start_time',
    'end_time',
    'actions'
  ];
  
  // Filter and pagination state
  protected readonly searchTerm = signal('');
  protected readonly monthFilter = signal<Date | null>(null);
  protected readonly sortField = signal<string>('time_start');
  protected readonly sortDirection = signal<'asc' | 'desc'>('desc');
  protected readonly pageSize = signal(10);
  protected readonly currentPage = signal(0);
  
  // Computed values
  protected readonly filteredTransactions = signal<Transaction[]>([]);
  protected readonly paginatedTransactions = signal<Transaction[]>([]);
  protected readonly totalTransactions = signal(0);
  
  // Statistics
  protected readonly totalEnergy = signal(0);
  protected readonly totalCost = signal(0);
  protected readonly completedSessions = signal(0);
  
  // Authentication
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly authLoading = signal(true);
  
  ngOnInit(): void {
    // Subscribe to auth state changes with timeout to handle page reload
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.authLoading.set(false);
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout);
        }
        // Set current month as default filter
        const currentMonth = new Date();
        this.monthFilter.set(currentMonth);
        this.loadTransactions();
      } else {
        // Give Firebase auth time to restore session on page reload
        this.authCheckTimeout = setTimeout(() => {
          this.authLoading.set(false);
        }, 1000); // 1 second delay
      }
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscription and timeout
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
  }
  
  protected loadTransactions(): void {
    const selectedMonth = this.monthFilter();
    
    if (selectedMonth) {
      // Load transactions for the selected month
      const { startTimestamp, endTimestamp } = this.getMonthTimestampRange(selectedMonth);
      this.transactionService.loadTransactionsByTimeRange(startTimestamp, endTimestamp).subscribe({
        next: (transactions) => {
          this.applyFilters();
          this.calculateStatistics();
        },
        error: (error) => {
          // Error loading transactions - handled by service
        }
      });
    } else {
      // Load all transactions
      this.transactionService.loadTransactions().subscribe({
        next: (transactions) => {
          this.applyFilters();
          this.calculateStatistics();
        },
        error: (error) => {
          // Error loading transactions - handled by service
        }
      });
    }
  }
  
  protected refreshTransactions(): void {
    this.transactionService.clearError();
    this.loadTransactions();
  }
  
  protected onSearchChange(searchTerm: string): void {
    this.searchTerm.set(searchTerm);
    this.applyFilters();
  }
  
  protected onMonthFilterChange(month: Date | null): void {
    this.monthFilter.set(month);
    this.currentPage.set(0); // Reset to first page when changing month
    this.loadTransactions(); // Reload data with new time range
  }
  
  protected onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
    this.applyFilters();
  }
  
  protected onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.applyFilters();
  }
  
  private applyFilters(): void {
    let filtered = [...this.transactionService.transactions()];
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(transaction => 
        transaction.transaction_id.toString().toLowerCase().includes(search) ||
        transaction.charge_point_id.toLowerCase().includes(search) ||
        transaction.id_tag.toLowerCase().includes(search) ||
        transaction.user_tag.username.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const field = this.sortField();
      let aValue: any, bValue: any;
      
      switch (field) {
        case 'time_start':
          aValue = new Date(a.time_start).getTime();
          bValue = new Date(b.time_start).getTime();
          break;
        case 'charge_point_id':
          aValue = a.charge_point_id;
          bValue = b.charge_point_id;
          break;
        case 'energy':
          aValue = a.meter_stop - a.meter_start;
          bValue = b.meter_stop - b.meter_start;
          break;
        case 'payment_amount':
          aValue = a.payment_amount / 100;
          bValue = b.payment_amount / 100;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return this.sortDirection() === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection() === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredTransactions.set(filtered);
    this.totalTransactions.set(filtered.length);
    
    // Apply pagination
    const startIndex = this.currentPage() * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.paginatedTransactions.set(filtered.slice(startIndex, endIndex));
  }
  
  private calculateStatistics(): void {
    const transactions = this.transactionService.transactions();
    
    const totalEnergy = transactions.reduce((sum, t) => sum + (t.meter_stop - t.meter_start) / 1000, 0);
    const totalCost = transactions.reduce((sum, t) => sum + (t.payment_amount / 100), 0);
    const completed = transactions.filter(t => t.is_finished).length;
    
    this.totalEnergy.set(totalEnergy);
    this.totalCost.set(totalCost);
    this.completedSessions.set(completed);
  }
  
  protected formatEnergy(meterStart: number, meterStop: number): string {
    const energy = (meterStop - meterStart) / 1000;
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
  
  protected formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  protected formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
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
  
  protected onTransactionClick(transaction: Transaction): void {
    // Open transaction preview dialog
    this.dialog.open(TransactionPreviewComponent, {
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { transactionId: transaction.transaction_id },
      disableClose: false,
      autoFocus: false,
      restoreFocus: false
    });
  }
  
  /**
   * Get timestamp range for a given month
   */
  private getMonthTimestampRange(month: Date): { startTimestamp: number; endTimestamp: number } {
    // Get the first day of the month at 00:00:00
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Get the last day of the month at 23:59:59
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
      startTimestamp: startOfMonth.getTime(),
      endTimestamp: endOfMonth.getTime()
    };
  }
  
  /**
   * Clear month filter and load all transactions
   */
  protected clearMonthFilter(): void {
    this.monthFilter.set(null);
    this.currentPage.set(0);
    this.loadTransactions();
  }
  
  /**
   * Navigate to login page
   */
  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
