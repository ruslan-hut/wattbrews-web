import { Component, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDetail } from '../../../core/models/transaction-detail.model';
import { EnergyChartComponent } from '../energy-chart/energy-chart.component';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-transaction-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    EnergyChartComponent
  ],
  templateUrl: './transaction-preview.component.html',
  styles: [`
    .transaction-preview-container {
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    ::ng-deep .mat-dialog-content {
      padding: 24px !important;
    }
    
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .preview-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .close-button {
      color: #5a6c7d;
    }
    
    .loading-container,
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
    
    .transaction-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    
    .overview-card,
    .status-card,
    .chart-card {
      margin-bottom: 0;
      margin-top: 8px;
      background: white;
      border: 1px solid #e9ecef;
    }
    
    .overview-card {
      margin-top: 0;
    }
    
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    
    .overview-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: white;
      border: 1px solid #e9ecef;
      border-radius: 8px;
    }
    
    .overview-item mat-icon {
      color: #6c757d;
      font-size: 1.5rem;
    }
    
    .item-content {
      display: flex;
      flex-direction: column;
    }
    
    .item-label {
      font-size: 0.8rem;
      color: #5a6c7d;
      margin-bottom: 2px;
    }
    
    .item-value {
      font-size: 1rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .status-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .status-label {
      font-weight: 500;
      color: #5a6c7d;
      min-width: 80px;
    }
    
    .status-value {
      color: #2c3e50;
    }
    
    .mat-chip.completed {
      background-color: #e8f5e8;
      color: #4caf50;
    }
    
    .mat-chip.charging {
      background-color: #fff3e0;
      color: #ff9800;
    }
    
    
    @media (max-width: 768px) {
      .transaction-preview-container {
        max-width: 100%;
        margin: 0;
      }
      
      .overview-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TransactionPreviewComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly dialogRef = inject(MatDialogRef<TransactionPreviewComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  protected readonly translationService = inject(SimpleTranslationService);
  
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly transactionDetail = signal<TransactionDetail | null>(null);
  
  ngOnInit(): void {
    this.loadTransactionDetail();
  }
  
  protected loadTransactionDetail(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.transactionService.loadTransactionDetail(this.data.transactionId).subscribe({
      next: (detail) => {
        this.transactionDetail.set(detail);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.message || 'Failed to load transaction details');
        this.loading.set(false);
      }
    });
  }
  
  protected closeDialog(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.dialogRef.close();
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
  
  
  protected formatEndTime(startTime: string, durationSeconds: number): string {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationSeconds * 1000);
    return end.toLocaleString();
  }
  
  protected hasMeterValues(): boolean {
    const detail = this.transactionDetail();
    return !!(detail?.meter_values && detail.meter_values.length > 0);
  }

  protected calculateAveragePower(): number {
    const detail = this.transactionDetail();
    if (!detail || !detail.consumed || !detail.duration || detail.duration === 0) {
      return 0;
    }
    
    // Convert consumed energy from Wh to W and duration from seconds to hours
    // Power (W) = Energy (Wh) / Time (h)
    const energyWh = detail.consumed;
    const durationHours = detail.duration / 3600; // Convert seconds to hours
    
    return energyWh / durationHours;
  }
}
