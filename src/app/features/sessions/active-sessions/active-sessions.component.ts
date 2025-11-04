import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { TransactionService } from '../../../core/services/transaction.service';
import { TransactionDetail } from '../../../core/models/transaction-detail.model';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
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
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Active transactions state
  protected readonly activeTransactions = signal<TransactionDetail[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Subscription management
  private subscription?: Subscription;

  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();
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
      
      // Load active transactions after translations are loaded
      this.loadActiveTransactions();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Still load active transactions even if translations fail
      this.loadActiveTransactions();
    }
  }

  private loadActiveTransactions(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.subscription = this.transactionService.loadActiveTransactions().subscribe({
      next: (transactions) => {
        this.activeTransactions.set(transactions);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.message || 'Failed to load active transactions');
        this.loading.set(false);
      }
    });
  }

  protected refreshTransactions(): void {
    this.transactionService.clearError();
    this.loadActiveTransactions();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
