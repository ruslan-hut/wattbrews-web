import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../../core/services/websocket.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { WsCommand, WsResponse, ResponseStatus, ResponseStage } from '../../../core/models/websocket.model';

export interface TransactionStopDialogData {
  transactionId: number;
  stationTitle: string;
}

interface TransactionStopState {
  status: 'initializing' | 'waiting' | 'success' | 'error';
  progress: number;
  info: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-transaction-stop-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './transaction-stop-dialog.component.html',
  styleUrl: './transaction-stop-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionStopDialogComponent implements OnInit, OnDestroy {
  private readonly wsService = inject(WebsocketService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly dialogRef = inject(MatDialogRef<TransactionStopDialogComponent>);

  readonly data = signal<TransactionStopDialogData>(inject(MAT_DIALOG_DATA));
  protected readonly translationsLoading = signal(true);

  readonly state = signal<TransactionStopState>({
    status: 'initializing',
    progress: 0,
    info: ''
  });

  private wsSubscription?: Subscription;
  private autoCloseTimeout?: any;

  ngOnInit(): void {
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
      // Stop transaction only after translations are loaded
      this.stopTransaction();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Stop transaction anyway to prevent blocking
      this.stopTransaction();
    }
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }

  private async stopTransaction(): Promise<void> {
    try {
      // Subscribe to websocket messages before sending command
      this.subscribeToMessages();

      // Send StopTransaction command
      await this.wsService.sendCommand(WsCommand.StopTransaction, {
        transaction_id: this.data().transactionId
      });

      // Update state to waiting
      this.state.update(s => ({
        ...s,
        status: 'waiting',
        info: this.translationService.getReactive('transactionStop.waiting')
      }));

    } catch (error: any) {
      console.error('Failed to stop transaction:', error);
      this.state.set({
        status: 'error',
        progress: 0,
        info: '',
        errorMessage: error.message || this.translationService.getReactive('transactionStop.errorSendingCommand')
      });
    }
  }

  private subscribeToMessages(): void {
    // Subscribe to all websocket messages and filter for stop stage
    this.wsSubscription = this.wsService.subscribe((message: WsResponse) => {
      // Only process messages related to the stop stage
      if (message.stage !== ResponseStage.Stop) {
        return;
      }

      console.log('Transaction stop message received:', message);

      switch (message.status) {
        case ResponseStatus.Waiting:
          this.handleWaitingMessage(message);
          break;
        case ResponseStatus.Success:
          this.handleSuccessMessage(message);
          break;
        case ResponseStatus.Error:
          this.handleErrorMessage(message);
          break;
      }
    });
  }

  private handleWaitingMessage(message: WsResponse): void {
    this.state.update(s => ({
      ...s,
      status: 'waiting',
      progress: message.progress || 0,
      info: this.translationService.getReactive('transactionStop.preparing')
    }));
  }

  private handleSuccessMessage(message: WsResponse): void {
    this.state.set({
      status: 'success',
      progress: 100,
      info: this.translationService.getReactive('transactionStop.success')
    });

    // Auto-close after 2 seconds
    this.autoCloseTimeout = setTimeout(() => {
      this.dialogRef.close({ success: true });
    }, 2000);
  }

  private handleErrorMessage(message: WsResponse): void {
    this.state.set({
      status: 'error',
      progress: 0,
      info: '',
      errorMessage: this.translationService.getReactive('transactionStop.errorOccurred')
    });
  }

  protected getIcon(): string {
    const status = this.state().status;
    switch (status) {
      case 'initializing':
      case 'waiting':
        return 'hourglass_empty';
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  protected getIconClass(): string {
    return this.state().status;
  }

  protected getTitle(): string {
    const status = this.state().status;
    switch (status) {
      case 'initializing':
        return this.translationService.getReactive('transactionStop.initializing');
      case 'waiting':
        return this.translationService.getReactive('transactionStop.stoppingTransaction');
      case 'success':
        return this.translationService.getReactive('transactionStop.transactionStopped');
      case 'error':
        return this.translationService.getReactive('transactionStop.failed');
      default:
        return '';
    }
  }

  protected getProgressMode(): 'determinate' | 'indeterminate' {
    return this.state().status === 'initializing' ? 'indeterminate' : 'determinate';
  }

  protected getProgressColor(): 'primary' | 'accent' | 'warn' {
    const status = this.state().status;
    if (status === 'error') return 'warn';
    if (status === 'success') return 'accent';
    return 'primary';
  }

  protected getMessageClass(): string {
    return this.state().status;
  }

  protected getStatusMessage(): string {
    const status = this.state().status;
    const info = this.state().info;
    
    if (info) return info;
    
    switch (status) {
      case 'initializing':
        return this.translationService.getReactive('transactionStop.sendingCommand');
      case 'waiting':
        return this.translationService.getReactive('transactionStop.waitingForResponse');
      case 'success':
        return this.translationService.getReactive('transactionStop.completed');
      default:
        return '';
    }
  }

  protected retry(): void {
    // Reset state and try again
    this.state.set({
      status: 'initializing',
      progress: 0,
      info: ''
    });
    this.stopTransaction();
  }

  protected close(): void {
    this.dialogRef.close({ success: false });
  }
}

