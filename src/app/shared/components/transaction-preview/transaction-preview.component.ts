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
  styleUrl: './transaction-preview.component.scss'
})
export class TransactionPreviewComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly dialogRef = inject(MatDialogRef<TransactionPreviewComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  protected readonly translationService = inject(SimpleTranslationService);
  
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly transactionDetail = signal<TransactionDetail | null>(null);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
      
      // After translations are loaded, load transaction detail
      this.loadTransactionDetail();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Still load transaction detail even if translations fail
      this.loadTransactionDetail();
    }
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

  protected calculateAveragePower(): string {
    const detail = this.transactionDetail();
    if (!detail || !detail.consumed || !detail.duration || detail.duration === 0) {
      return '0 W';
    }
    
    // Convert consumed energy from Wh to W and duration from seconds to hours
    // Power (W) = Energy (Wh) / Time (h)
    const energyWh = detail.consumed;
    const durationHours = detail.duration / 3600; // Convert seconds to hours
    
    const powerInWatts = energyWh / durationHours;
    
    // Return in kW if >= 1000 W, otherwise in W
    if (powerInWatts >= 1000) {
      const powerInKw = powerInWatts / 1000;
      return `${powerInKw.toFixed(1)} kW`;
    } else {
      return `${powerInWatts.toFixed(0)} W`;
    }
  }
}
