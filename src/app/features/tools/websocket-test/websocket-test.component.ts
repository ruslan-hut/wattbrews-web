import { Component, signal, computed, inject, DestroyRef, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WebsocketService } from '../../../core/services/websocket.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { WsCommand, WsResponse, ResponseStatus, ResponseStage, ConnectionState } from '../../../core/models/websocket.model';
import { APP_CONSTANTS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-websocket-test',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTabsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './websocket-test.component.html',
  styleUrl: './websocket-test.component.scss'
})
export class WebsocketTestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly websocketService = inject(WebsocketService);
  protected readonly translationService = inject(SimpleTranslationService);

  // Expose enums to template
  protected readonly WsCommand = WsCommand;
  protected readonly ResponseStatus = ResponseStatus;
  protected readonly ResponseStage = ResponseStage;
  protected readonly ConnectionState = ConnectionState;

  // Signals
  protected readonly messages = signal<WsResponse[]>([]);
  protected readonly selectedMessage = signal<WsResponse | null>(null);
  protected readonly selectedCommand = signal<WsCommand>(WsCommand.PingConnection);
  protected readonly filterStatus = signal<ResponseStatus | 'all'>('all');
  protected readonly filterStage = signal<ResponseStage | 'all'>('all');
  protected readonly autoScroll = signal<boolean>(true);

  // Form
  protected commandForm: FormGroup;

  // Computed signals
  protected readonly filteredMessages = computed(() => {
    let msgs = this.messages();
    
    const statusFilter = this.filterStatus();
    if (statusFilter !== 'all') {
      msgs = msgs.filter(m => m.status === statusFilter);
    }
    
    const stageFilter = this.filterStage();
    if (stageFilter !== 'all') {
      msgs = msgs.filter(m => m.stage === stageFilter);
    }
    
    return msgs;
  });

  protected readonly connectionStats = computed(() => {
    const uptime = this.websocketService.getUptime();
    const messageCount = this.websocketService.messageCount();
    const reconnectCount = this.websocketService.reconnectCount();
    
    return {
      uptime: this.formatDuration(uptime),
      messageCount,
      reconnectCount
    };
  });

  protected readonly messagesByStatus = computed(() => {
    const msgs = this.messages();
    const stats: Record<string, number> = {};
    
    Object.values(ResponseStatus).forEach(status => {
      stats[status] = msgs.filter(m => m.status === status).length;
    });
    
    return stats;
  });

  protected readonly messagesByStage = computed(() => {
    const msgs = this.messages();
    const stats: Record<string, number> = {};
    
    Object.values(ResponseStage).forEach(stage => {
      stats[stage] = msgs.filter(m => m.stage === stage).length;
    });
    
    return stats;
  });

  // Available commands for dropdown
  protected readonly availableCommands = Object.values(WsCommand);
  protected readonly availableStatuses = ['all', ...Object.values(ResponseStatus)];
  protected readonly availableStages = ['all', ...Object.values(ResponseStage)];
  protected readonly statusValues = Object.values(ResponseStatus);
  protected readonly stageValues = Object.values(ResponseStage);

  constructor() {
    // Initialize form
    this.commandForm = this.fb.group({
      command: [WsCommand.PingConnection, Validators.required],
      charge_point_id: [''],
      connector_id: [''],
      transaction_id: ['']
    });

    // Auto-scroll effect
    effect(() => {
      if (this.autoScroll() && this.messages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit(): void {
    // Auto-connect to WebSocket
    this.websocketService.connect();

    // Subscribe to messages
    const subscription = this.websocketService.subscribe((message) => {
      this.messages.update(msgs => {
        const newMessages = [...msgs, message];
        // Limit history
        if (newMessages.length > APP_CONSTANTS.WEBSOCKET.MESSAGE_HISTORY_LIMIT) {
          return newMessages.slice(-APP_CONSTANTS.WEBSOCKET.MESSAGE_HISTORY_LIMIT);
        }
        return newMessages;
      });
    });

    // Clean up subscription
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  // Connection methods
  protected connect(): void {
    this.websocketService.connect();
  }

  protected disconnect(): void {
    this.websocketService.disconnect();
  }

  // Command methods
  protected async sendCommand(): Promise<void> {
    if (this.commandForm.invalid) {
      return;
    }

    const formValue = this.commandForm.value;
    const command = formValue.command as WsCommand;
    
    const params: any = {};
    
    if (formValue.charge_point_id) {
      params.charge_point_id = formValue.charge_point_id;
    }
    
    if (formValue.connector_id) {
      params.connector_id = parseInt(formValue.connector_id, 10);
    }
    
    if (formValue.transaction_id) {
      params.transaction_id = parseInt(formValue.transaction_id, 10);
    }

    try {
      await this.websocketService.sendCommand(command, params);
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  }

  protected async quickPing(): Promise<void> {
    try {
      await this.websocketService.sendCommand(WsCommand.PingConnection);
    } catch (error) {
      console.error('Failed to send ping:', error);
    }
  }

  protected async quickListenChargePoints(): Promise<void> {
    try {
      await this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    } catch (error) {
      console.error('Failed to listen charge points:', error);
    }
  }

  protected async quickListenLog(): Promise<void> {
    try {
      await this.websocketService.sendCommand(WsCommand.ListenLog);
    } catch (error) {
      console.error('Failed to listen log:', error);
    }
  }

  // Message methods
  protected selectMessage(message: WsResponse): void {
    this.selectedMessage.set(message);
  }

  protected clearLog(): void {
    this.messages.set([]);
    this.selectedMessage.set(null);
  }

  protected exportLog(): void {
    const data = JSON.stringify(this.messages(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `websocket-log-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async copyMessage(message: WsResponse): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(message, null, 2));
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  // Helper methods
  protected getStatusColor(status: ResponseStatus): string {
    switch (status) {
      case ResponseStatus.Success: return 'success';
      case ResponseStatus.Error: return 'error';
      case ResponseStatus.Waiting: return 'waiting';
      case ResponseStatus.Ping: return 'ping';
      case ResponseStatus.Value: return 'value';
      case ResponseStatus.Event: return 'event';
      default: return '';
    }
  }

  protected getStageIcon(stage: ResponseStage): string {
    switch (stage) {
      case ResponseStage.Start: return 'play_arrow';
      case ResponseStage.Stop: return 'stop';
      case ResponseStage.Info: return 'info';
      case ResponseStage.LogEvent: return 'description';
      case ResponseStage.ChargePointEvent: return 'ev_station';
      default: return 'help';
    }
  }

  protected formatTimestamp(date?: Date): string {
    if (!date) {
      date = new Date();
    }
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    } as any);
  }

  protected formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  protected formatDuration(ms: number): string {
    if (ms === 0) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  protected getCommandRequiredFields(command: WsCommand): string[] {
    switch (command) {
      case WsCommand.StartTransaction:
        return ['charge_point_id', 'connector_id'];
      case WsCommand.StopTransaction:
        return ['transaction_id'];
      case WsCommand.ListenTransaction:
      case WsCommand.StopListenTransaction:
        return ['transaction_id'];
      default:
        return [];
    }
  }

  protected shouldShowField(field: string): boolean {
    const command = this.commandForm.get('command')?.value;
    const requiredFields = this.getCommandRequiredFields(command);
    return requiredFields.includes(field);
  }

  private scrollToBottom(): void {
    const messageLog = document.querySelector('.message-log-container');
    if (messageLog) {
      messageLog.scrollTop = messageLog.scrollHeight;
    }
  }
}

