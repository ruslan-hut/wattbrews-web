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
import { MatExpansionModule } from '@angular/material/expansion';
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
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './sessions-history.component.html',
  styles: [`
    .sessions-history-container {
      padding: var(--energy-space-xl);
      max-width: var(--container-2xl);
      margin: 0 auto;
      background-color: var(--energy-background);
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: var(--energy-space-xl);
      text-align: center;
    }

    .page-title {
      font-family: var(--font-family-display);
      font-size: var(--font-size-3xl);
      font-weight: 600;
      letter-spacing: -0.03em;
      margin: 0 0 var(--energy-space-sm) 0;
      color: var(--energy-text-primary);
      line-height: 1.2;
    }

    .page-subtitle {
      font-family: var(--font-family-body);
      font-size: var(--font-size-lg);
      color: var(--energy-text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .auth-required-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-md);
      padding: var(--energy-space-2xl);
      text-align: center;
      background: var(--energy-surface);
      border-radius: var(--energy-radius-xl);
      box-shadow: var(--energy-shadow-md);
      border: 1px solid var(--energy-border);
      margin-bottom: var(--energy-space-2xl);
    }

    .auth-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--energy-text-muted);
    }

    .auth-required-message h3 {
      font-family: var(--font-family-display);
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--energy-text-primary);
    }

    .auth-required-message p {
      font-family: var(--font-family-body);
      margin: 0;
      color: var(--energy-text-secondary);
      font-size: var(--font-size-base);
      line-height: 1.5;
      max-width: 500px;
    }

    /* Desktop Stats */
    .stats-row {
      display: flex;
      gap: var(--energy-space-xl);
      margin-bottom: var(--energy-space-xl);
      flex-wrap: wrap;
    }

    .stat-card {
      flex: 1;
      min-width: 200px;
      background: var(--energy-surface);
      border: 1px solid var(--energy-border);
      border-radius: var(--energy-radius-xl);
      box-shadow: var(--energy-shadow-sm);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: var(--energy-space-md);
    }

    .stat-value {
      font-family: var(--font-family-display);
      font-size: var(--font-size-2xl);
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--energy-text-primary);
      margin: 0;
    }

    .stat-label {
      font-family: var(--font-family-body);
      font-size: var(--font-size-sm);
      color: var(--energy-text-secondary);
      margin: var(--energy-space-xs) 0 0 0;
    }

    .stat-icon {
      color: var(--energy-primary);
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    /* Mobile Stats - Hidden by default */
    .stats-card-mobile {
      display: none;
      background: var(--energy-surface);
      border: 1px solid var(--energy-border);
      border-radius: var(--energy-radius-xl);
      box-shadow: var(--energy-shadow-sm);
      margin-bottom: var(--energy-space-lg);
    }

    .stats-grid-mobile {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--energy-space-sm);
      text-align: center;
    }

    .stat-item-mobile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-xs);
      padding: var(--energy-space-sm);
    }

    .stat-icon-mobile {
      color: var(--energy-primary);
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .stat-value-mobile {
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--energy-text-primary);
    }

    .stat-label-mobile {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      color: var(--energy-text-muted);
    }

    /* Desktop Filters */
    .filters-section {
      margin-bottom: var(--energy-space-xl);
    }

    .filters-row {
      display: flex;
      gap: var(--energy-space-md);
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
    }

    .search-field {
      font-family: var(--font-family-body);
      flex: 1;
      min-width: 300px;
    }

    .year-filter-field,
    .month-filter-field {
      font-family: var(--font-family-body);
    }

    .year-filter-field {
      min-width: 120px;
    }

    .month-filter-field {
      min-width: 160px;
    }

    /* Mobile Filters - Hidden by default */
    .filters-panel-mobile {
      display: none;
      margin-bottom: var(--energy-space-lg);
      border-radius: var(--energy-radius-xl);
      background: var(--energy-surface);
      border: 1px solid var(--energy-border);
    }

    .filters-panel-mobile .mat-expansion-panel-header-title {
      display: flex;
      align-items: center;
      gap: var(--energy-space-sm);
      font-family: var(--font-family-body);
      font-weight: 500;
      color: var(--energy-text-primary);
    }

    .filters-row-mobile {
      display: flex;
      flex-direction: column;
      gap: var(--energy-space-sm);
    }

    .filter-field-mobile {
      width: 100%;
      font-family: var(--font-family-body);
    }

    .filter-selects-row {
      display: flex;
      gap: var(--energy-space-sm);
    }

    .filter-selects-row .filter-field-mobile {
      flex: 1;
    }

    .transactions-section {
      margin-bottom: var(--energy-space-xl);
    }

    .transactions-card {
      padding: 0;
      background: var(--energy-surface);
      border: 1px solid var(--energy-border);
      border-radius: var(--energy-radius-xl);
      box-shadow: var(--energy-shadow-sm);
    }

    .card-header {
      padding: var(--energy-space-lg) var(--energy-space-lg) 0 var(--energy-space-lg);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-family: var(--font-family-display);
      font-size: var(--font-size-lg);
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0;
      color: var(--energy-text-primary);
    }

    .refresh-button {
      margin-left: auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-md);
      padding: var(--energy-space-2xl);
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-md);
      padding: var(--energy-space-2xl);
      text-align: center;
    }

    .error-icon {
      color: var(--energy-error);
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }

    .transactions-table {
      width: 100%;
    }

    .transactions-table th {
      font-family: var(--font-family-body);
      font-weight: 600;
    }

    .transactions-table td {
      font-family: var(--font-family-body);
    }

    .transaction-row {
      cursor: pointer;
      transition: background-color var(--transition-base);
    }

    .transaction-row:hover {
      background-color: var(--energy-surface-variant);
    }

    .status-chip {
      font-family: var(--font-family-body);
      font-size: var(--font-size-xs);
      font-weight: 500;
    }

    .status-chip.completed {
      background-color: var(--energy-success-light);
      color: var(--energy-success-dark);
    }

    .status-chip.in-progress {
      background-color: var(--energy-warning-light);
      color: var(--energy-warning-dark);
    }

    .energy-value {
      font-family: var(--font-family-body);
      font-weight: 500;
      color: var(--energy-text-primary);
    }

    .payment-amount {
      font-family: var(--font-family-body);
      font-weight: 600;
      color: var(--energy-success);
    }

    .no-transactions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-md);
      padding: var(--energy-space-2xl) var(--energy-space-lg);
      text-align: center;
    }

    .no-data-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: var(--energy-text-muted);
    }

    .no-transactions h3 {
      font-family: var(--font-family-display);
      margin: 0;
      color: var(--energy-text-secondary);
      font-weight: 500;
    }

    .no-transactions p {
      font-family: var(--font-family-body);
      margin: 0;
      color: var(--energy-text-muted);
    }

    .mobile-transactions {
      display: none;
    }

    .transactions-table {
      display: table;
    }

    @media (max-width: 768px) {
      .sessions-history-container {
        padding: var(--energy-space-md);
      }

      .page-title {
        font-size: var(--font-size-2xl);
      }

      .page-subtitle {
        font-size: var(--font-size-base);
      }

      /* Hide desktop stats, show mobile */
      .desktop-stats {
        display: none;
      }

      .stats-card-mobile {
        display: block;
      }

      /* Hide desktop filters, show mobile */
      .filters-desktop {
        display: none;
      }

      .filters-panel-mobile {
        display: block;
      }

      .card-header {
        padding: var(--energy-space-md);
      }

      .refresh-button {
        margin-left: 0;
      }

      .transactions-table {
        display: none !important;
      }

      .mobile-transactions {
        display: block !important;
        background-color: var(--energy-surface-variant);
        padding: var(--energy-space-sm);
        border-radius: var(--energy-radius-lg);
      }

      .mobile-transaction-card {
        display: block;
        margin-bottom: var(--energy-space-md);
        padding: var(--energy-space-md);
        border: 1px solid var(--energy-border);
        border-radius: var(--energy-radius-xl);
        background: var(--energy-surface);
        box-shadow: var(--energy-shadow-sm);
        cursor: pointer;
        transition: all var(--transition-base);
      }

      .mobile-transaction-card:active {
        transform: scale(0.98);
      }

      .mobile-transaction-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--energy-space-md);
      }

      .mobile-transaction-id {
        font-family: var(--font-family-display);
        font-weight: 600;
        color: var(--energy-text-primary);
        font-size: var(--font-size-base);
      }

      .mobile-transaction-details {
        display: flex;
        flex-direction: column;
      }

      .mobile-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--energy-space-xs) 0;
      }

      .mobile-detail-label {
        font-family: var(--font-family-body);
        font-size: var(--font-size-sm);
        color: var(--energy-text-muted);
      }

      .mobile-detail-value {
        font-family: var(--font-family-body);
        font-size: var(--font-size-sm);
        color: var(--energy-text-primary);
        font-weight: 600;
        text-align: right;
      }

      .mobile-detail-value.energy {
        color: var(--energy-primary);
      }

      .mobile-detail-value.payment {
        color: var(--energy-success);
      }

      .mobile-transaction-time {
        font-family: var(--font-family-body);
        font-size: var(--font-size-xs);
        color: var(--energy-text-muted);
        margin-top: var(--energy-space-sm);
        padding-top: var(--energy-space-sm);
        border-top: 1px solid var(--energy-border);
      }

      .no-transactions {
        padding: var(--energy-space-xl) var(--energy-space-md);
      }

      .no-data-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
    }

    @media (max-width: 480px) {
      .sessions-history-container {
        padding: var(--energy-space-sm);
      }

      .page-title {
        font-size: var(--font-size-xl);
      }

      .stat-value-mobile {
        font-size: var(--font-size-base);
      }

      .stat-label-mobile {
        font-size: 0.65rem;
      }

      .stat-icon-mobile {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
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
  private languageSubscription?: Subscription;
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
  protected readonly selectedYear = signal<number | null>(null);
  protected readonly selectedMonth = signal<number | null>(null);
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
  protected readonly translationsLoading = signal(true);

  // Available years and months
  protected readonly availableYears = signal<number[]>([]);
  protected readonly availableMonths = signal<{value: number, label: string}[]>([]);
  
  ngOnInit(): void {
    // Initialize available years
    this.initializeYears();
    
    // Initialize translations first, regardless of auth state
    this.initializeTranslations();
    
    // Subscribe to language changes to update month names
    this.languageSubscription = this.translationService.language$.subscribe(() => {
      this.initializeMonths();
    });
    
    // Subscribe to auth state changes with timeout to handle page reload
    this.authSubscription = this.authService.user$.subscribe(async user => {
      if (user) {
        this.authLoading.set(false);
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout);
        }
        
        // Set current year and month as default filter
        const currentDate = new Date();
        this.selectedYear.set(currentDate.getFullYear());
        this.selectedMonth.set(currentDate.getMonth() + 1); // Month is 1-based for display
        this.loadTransactions();
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
      // Initialize months after translations are loaded
      this.initializeMonths();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions and timeout
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
  }
  
  protected loadTransactions(): void {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    
    if (year && month) {
      // Load transactions for the selected year and month
      const { startTimestamp, endTimestamp } = this.getYearMonthTimestampRange(year, month);
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
  
  protected onYearChange(year: number | null): void {
    this.selectedYear.set(year);
    this.currentPage.set(0); // Reset to first page when changing year
    this.loadTransactions(); // Reload data with new time range
  }

  protected onMonthChange(month: number | null): void {
    this.selectedMonth.set(month);
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
      const key = diffDays === 1 ? 'sessions.history.timeFormat.daysAgo' : 'sessions.history.timeFormat.daysAgo_plural';
      return this.translationService.get(key, { count: diffDays });
    } else if (diffHours > 0) {
      const key = diffHours === 1 ? 'sessions.history.timeFormat.hoursAgo' : 'sessions.history.timeFormat.hoursAgo_plural';
      return this.translationService.get(key, { count: diffHours });
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const key = diffMinutes === 1 ? 'sessions.history.timeFormat.minutesAgo' : 'sessions.history.timeFormat.minutesAgo_plural';
      return this.translationService.get(key, { count: diffMinutes });
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
   * Get timestamp range for a given year and month
   */
  private getYearMonthTimestampRange(year: number, month: number): { startTimestamp: number; endTimestamp: number } {
    // Get the first day of the month at 00:00:00
    const startOfMonth = new Date(year, month - 1, 1); // month is 1-based, Date constructor expects 0-based
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Get the last day of the month at 23:59:59
    const endOfMonth = new Date(year, month, 0); // month is 1-based, so month gives us the last day of previous month
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
      startTimestamp: startOfMonth.getTime(),
      endTimestamp: endOfMonth.getTime()
    };
  }
  
  /**
   * Clear date filter and load all transactions
   */
  protected clearDateFilter(): void {
    this.selectedYear.set(null);
    this.selectedMonth.set(null);
    this.currentPage.set(0);
    this.loadTransactions();
  }
  
  /**
   * Navigate to login page
   */
  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Initialize available years
   */
  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    this.availableYears.set(years);
  }

  /**
   * Initialize available months with translated names
   */
  private initializeMonths(): void {
    const months = [
      { value: 1, label: this.translationService.get('common.months.1') },
      { value: 2, label: this.translationService.get('common.months.2') },
      { value: 3, label: this.translationService.get('common.months.3') },
      { value: 4, label: this.translationService.get('common.months.4') },
      { value: 5, label: this.translationService.get('common.months.5') },
      { value: 6, label: this.translationService.get('common.months.6') },
      { value: 7, label: this.translationService.get('common.months.7') },
      { value: 8, label: this.translationService.get('common.months.8') },
      { value: 9, label: this.translationService.get('common.months.9') },
      { value: 10, label: this.translationService.get('common.months.10') },
      { value: 11, label: this.translationService.get('common.months.11') },
      { value: 12, label: this.translationService.get('common.months.12') }
    ];
    this.availableMonths.set(months);
  }
}
