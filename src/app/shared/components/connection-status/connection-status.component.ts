import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WebsocketService } from '../../../core/services/websocket.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { ConnectionState } from '../../../core/models/websocket.model';

@Component({
  selector: 'app-connection-status',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './connection-status.component.html',
  styleUrl: './connection-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectionStatusComponent {
  private readonly websocketService = inject(WebsocketService);
  protected readonly translationService = inject(SimpleTranslationService);

  // Expose enum to template
  protected readonly ConnectionState = ConnectionState;

  // Signals
  protected readonly dismissed = signal<boolean>(false);
  
  // Computed signals
  protected readonly showBanner = computed(() => {
    const state = this.websocketService.connectionState();
    const isDismissed = this.dismissed();
    
    // Show banner when disconnected or reconnecting, unless dismissed
    const shouldShow = (
      state === ConnectionState.Disconnected || 
      state === ConnectionState.Reconnecting ||
      state === ConnectionState.Error
    );
    
    // Auto-show when reconnecting even if previously dismissed
    if (state === ConnectionState.Reconnecting && isDismissed) {
      this.dismissed.set(false);
    }
    
    return shouldShow && !isDismissed;
  });

  protected readonly connectionState = computed(() => 
    this.websocketService.connectionState()
  );

  // Methods
  protected dismiss(): void {
    this.dismissed.set(true);
  }
}

