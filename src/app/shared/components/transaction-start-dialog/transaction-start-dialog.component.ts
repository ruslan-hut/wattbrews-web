import { Component, inject, signal, OnInit, OnDestroy, DestroyRef, ChangeDetectionStrategy } from '@angular/core';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WebsocketService } from '../../../core/services/websocket.service';
import { SimpleTranslationService } from '../../../core/services';
import { WsCommand, WsResponse, ResponseStatus, ResponseStage } from '../../../core/models';

export interface TransactionStartDialogData {
  chargePointId: string;
  connectorId: number;
  stationTitle: string;
}

interface TransactionStartState {
  status: 'initializing' | 'waiting' | 'success' | 'error';
  progress: number;
  info: string;
  errorMessage?: string;
  transactionId?: number;
}

@Component({
  selector: 'app-transaction-start-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
],
  templateUrl: './transaction-start-dialog.component.html',
  styleUrl: './transaction-start-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionStartDialogComponent implements OnInit, OnDestroy {
  private readonly wsService = inject(WebsocketService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly dialogRef = inject(MatDialogRef<TransactionStartDialogComponent>);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = signal<TransactionStartDialogData>(inject(MAT_DIALOG_DATA));
  protected readonly translationsLoading = signal(true);

  readonly state = signal<TransactionStartState>({
    status: 'initializing',
    progress: 0,
    info: ''
  });

  private autoCloseTimeout?: ReturnType<typeof setTimeout>;

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
      // Start transaction only after translations are loaded
      this.startTransaction();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Start transaction anyway to prevent blocking
      this.startTransaction();
    }
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
    }
  }

  private async startTransaction(): Promise<void> {
    try {
      // Subscribe to websocket messages before sending command
      this.subscribeToMessages();

      // Send StartTransaction command
      await this.wsService.sendCommand(WsCommand.StartTransaction, {
        charge_point_id: this.data().chargePointId,
        connector_id: this.data().connectorId
      });

      // Update state to waiting
      this.state.update(s => ({
        ...s,
        status: 'waiting',
        info: this.translationService.getReactive('transactionStart.waiting')
      }));

    } catch (error: any) {
      console.error('Failed to start transaction:', error);
      this.state.set({
        status: 'error',
        progress: 0,
        info: '',
        errorMessage: error.message || this.translationService.getReactive('transactionStart.errorSendingCommand')
      });
    }
  }

  private subscribeToMessages(): void {
    // Subscribe to all websocket messages and filter for start stage
    this.wsService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message: WsResponse) => {
        // Only process messages related to the start stage
        if (message.stage !== ResponseStage.Start) {
          return;
        }

        console.log('Transaction start message received:', message);

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
      info: this.translationService.getReactive('transactionStart.preparing')
    }));
  }

  private handleSuccessMessage(message: WsResponse): void {
    this.state.set({
      status: 'success',
      progress: 100,
      info: this.translationService.getReactive('transactionStart.success'),
      transactionId: message.id
    });

    // Auto-close and navigate after 2 seconds
    this.autoCloseTimeout = setTimeout(() => {
      this.dialogRef.close({ success: true, transactionId: message.id });
      // Navigate to active sessions (will be implemented later)
      this.router.navigate(['/sessions/active']);
    }, 2000);
  }

  private handleErrorMessage(message: WsResponse): void {
    this.state.set({
      status: 'error',
      progress: 0,
      info: '',
      errorMessage: this.translationService.getReactive('transactionStart.errorOccurred')
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
        return this.translationService.getReactive('transactionStart.initializing');
      case 'waiting':
        return this.translationService.getReactive('transactionStart.startingTransaction');
      case 'success':
        return this.translationService.getReactive('transactionStart.transactionStarted');
      case 'error':
        return this.translationService.getReactive('transactionStart.failed');
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
        return this.translationService.getReactive('transactionStart.sendingCommand');
      case 'waiting':
        return this.translationService.getReactive('transactionStart.waitingForResponse');
      case 'success':
        return this.translationService.getReactive('transactionStart.redirecting');
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
    this.startTransaction();
  }

  protected close(): void {
    this.dialogRef.close({ success: false });
  }
}

