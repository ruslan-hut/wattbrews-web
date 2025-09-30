import { Component, signal, inject, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { ChargePointService } from '../../core/services/chargepoint.service';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ChargePoint, ChargePointConnector } from '../../core/models/chargepoint.model';
import { Transaction } from '../../core/models/transaction.model';
import { TransactionPreviewComponent } from '../../shared/components/transaction-preview/transaction-preview.component';

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
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .dashboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .dashboard-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #2c3e50;
    }
    
    .dashboard-subtitle {
      font-size: 1.1rem;
      color: #5a6c7d;
      margin-bottom: 0;
    }
    
    .dashboard-main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 2rem;
    }
    
    .dashboard-card {
      height: fit-content;
    }
    
    
    .overview-card {
      background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
      color: #2c3e50;
      border: 1px solid #dadce0;
    }
    
    .overview-card .mat-mdc-card-title {
      color: #2c3e50;
    }
    
    .charge-points-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #2c3e50;
      border: 1px solid #ced4da;
    }
    
    .charge-points-card .mat-mdc-card-title,
    .charge-points-card .mat-mdc-card-subtitle {
      color: #2c3e50;
    }

    .recent-charge-points-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #2c3e50;
      border: 1px solid #ced4da;
    }
    
    .recent-charge-points-card .mat-mdc-card-title,
    .recent-charge-points-card .mat-mdc-card-subtitle {
      color: #2c3e50;
    }
    
    .transactions-card {
      background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
      color: #2c3e50;
      border: 1px solid #dadce0;
    }
    
    .transactions-card .mat-mdc-card-title,
    .transactions-card .mat-mdc-card-subtitle {
      color: #2c3e50;
    }
    
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .transaction-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e9ecef;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .transaction-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }
    
    .transaction-left-section {
      flex: 1;
    }
    
    .transaction-title {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .transaction-duration,
    .transaction-time,
    .transaction-relative-time {
      margin: 4px 0;
      font-size: 0.9rem;
      color: #5a6c7d;
    }
    
    .transaction-time {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .transaction-relative-time {
      font-size: 0.8rem;
      color: #8a9ba8;
    }
    
    .transaction-right-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }
    
    .transaction-energy-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #4caf50;
      line-height: 1;
    }
    
    .transaction-energy-unit {
      font-size: 0.9rem;
      color: #5a6c7d;
      margin-top: 4px;
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
      color: #5a6c7d;
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
      color: #6c757d;
      font-size: 2rem;
    }
    
    .overview-card .stat-icon {
      color: #5a6c7d;
      font-size: 1.5rem;
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #5a6c7d;
    }
    
    .overview-card .stat-value {
      color: #2c3e50;
    }
    
    .overview-card .stat-label {
      color: #5a6c7d;
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
      max-height: 400px;
      overflow-y: auto;
    }

    .recent-charge-points-list {
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
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e9ecef;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
    }

    .recent-charge-point-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #e9ecef;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    
    .charge-point-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }

    .recent-charge-point-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }

    .charge-point-actions {
      display: flex;
      align-items: center;
      margin-left: 12px;
    }

    
    .charge-point-status-indicator {
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      border-radius: 12px 0 0 12px;
    }
    
    .charge-point-status-indicator.available {
      background: #4caf50;
    }
    
    .charge-point-status-indicator.busy {
      background: #ff9800;
    }
    
    .charge-point-info {
      flex: 1;
    }
    
    .charge-point-title {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .charge-point-address {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      color: #5a6c7d;
    }
    
    .connectors-section {
      margin-bottom: 8px;
    }
    
    .connectors-title {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .connectors-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .connector-chip {
      font-size: 0.75rem;
      height: 28px;
      display: flex !important;
      align-items: center !important;
    }
    
    .connector-chip ::ng-deep .mat-mdc-chip-action {
      display: flex !important;
      align-items: center !important;
      flex-direction: row !important;
      height: 100%;
      padding: 0 8px;
      gap: 4px;
      white-space: nowrap;
      line-height: 1;
    }
    
    .connector-chip ::ng-deep .mat-mdc-chip-action .mat-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 4px;
      vertical-align: middle;
    }
    
    .connector-chip ::ng-deep .mat-mdc-chip-action .mat-mdc-chip-action-label {
      display: inline !important;
      line-height: 1;
      vertical-align: middle;
    }
    
    .connector-chip.available {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    .connector-chip.occupied {
      background-color: #fff3e0;
      color: #f57c00;
    }
    
    .connector-chip.out_of_order {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .connector-chip.reserved {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .connector-chip.unknown {
      background-color: #f5f5f5;
      color: #757575;
    }
    
    .chip-icon {
      font-size: 0.9rem;
      margin-right: 0.25rem;
    }
    
    .no-charge-points {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 20px;
      text-align: center;
    }
    
    .no-charge-points .no-data-icon {
      font-size: 3rem;
      color: #adb5bd;
    }
    
    .no-charge-points p {
      margin: 0;
      color: #5a6c7d;
      font-size: 1rem;
    }

    .no-recent-charge-points {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 20px;
      text-align: center;
    }
    
    .no-recent-charge-points .no-data-icon {
      font-size: 3rem;
      color: #adb5bd;
    }
    
    .no-recent-charge-points p {
      margin: 0;
      color: #5a6c7d;
      font-size: 1rem;
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
      
      .dashboard-header {
        margin-bottom: 1.5rem;
      }
      
      .dashboard-title {
        font-size: 2rem;
      }
      
      .dashboard-subtitle {
        font-size: 1rem;
      }
      
      .dashboard-main-content {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 1.5rem;
      }
      
      
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .stat-item {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }
      
      .stat-icon {
        font-size: 1.5rem;
      }
      
      .stat-value {
        font-size: 1.2rem;
      }
      
      .charge-point-item {
        padding: 12px;
      }
      
      .connectors-list {
        gap: 4px;
      }
      
      .connector-chip {
        font-size: 0.7rem;
        height: 26px;
      }
      
      .transaction-item {
        flex-direction: row;
        gap: 12px;
        padding: 12px;
        align-items: center;
      }
      
      .transaction-right-section {
        align-items: flex-end;
        text-align: right;
        min-width: 80px;
      }
      
      .transaction-energy-value {
        font-size: 1.8rem;
      }
      
      .charge-points-list {
        max-height: 300px;
      }
    }
    
    @media (max-width: 480px) {
      .dashboard-container {
        padding: 8px;
      }
      
      .dashboard-title {
        font-size: 1.8rem;
      }
      
      .dashboard-subtitle {
        font-size: 0.9rem;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .stat-item {
        flex-direction: row;
        text-align: left;
        gap: 12px;
      }
      
    }
  `]
})
export class DashboardComponent implements OnInit {
  protected readonly chargePointService = inject(ChargePointService);
  protected readonly authService = inject(AuthService);
  protected readonly transactionService = inject(TransactionService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  
  protected readonly totalSessions = signal(24);
  protected readonly totalEnergy = signal(156.8);
  protected readonly totalCost = signal(89.50); // This will be calculated from actual transactions
  
  
  ngOnInit(): void {
    // Wait for authentication before loading data
    this.authService.user$.subscribe(user => {
      if (user) {
        console.log('User authenticated, loading data');
        this.loadChargePoints();
        this.loadRecentChargePoints();
        this.loadTransactions();
      } else {
        console.log('User not authenticated, skipping data load');
      }
    });
  }
  
  protected recentChargePoints(): ChargePoint[] {
    return this.transactionService.getRecentChargePoints();
  }
  
  protected recentTransactions(): Transaction[] {
    return this.transactionService.getRecentTransactions();
  }
  
  protected getAvailableConnectors(chargePoint: ChargePoint): number {
    return chargePoint.connectors.filter(conn => conn.status === 'Available').length;
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
    if (chargePoint.is_enabled && chargePoint.status === 'Available') {
      // Navigate to station detail or start charging flow
      console.log('Starting charging session for:', chargePoint.title);
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
      return 'Station is offline';
    }
    if (!chargePoint.is_enabled) {
      return 'Station is disabled';
    }
    if (this.getAvailableConnectors(chargePoint) === 0) {
      return 'No available connectors';
    }
    return 'Start charging at this station';
  }

  protected startCharge(stationId: string): void {
    // Navigate to charge initiation screen
    this.router.navigate(['/stations', stationId, 'charge']);
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

  private loadRecentChargePoints(): void {
    console.log('Attempting to load recent charge points...');
    this.transactionService.loadRecentChargePoints().subscribe({
      next: (chargePoints) => {
        console.log('Recent charge points loaded successfully:', chargePoints);
      },
      error: (error) => {
        console.error('Error loading recent charge points:', error);
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

  protected formatTransactionDateTime(timeStart: string): string {
    const date = new Date(timeStart);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
