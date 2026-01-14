import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { APP_CONSTANTS } from '../constants/app.constants';
import {
  WsCommand,
  UserRequest,
  WsResponse,
  ResponseStatus,
  ResponseStage,
  ConnectionState
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // WebSocket instance
  private ws: WebSocket | null = null;

  // State management signals
  private readonly _connectionState = signal<ConnectionState>(ConnectionState.Disconnected);
  private readonly _lastMessage = signal<WsResponse | null>(null);
  private readonly _lastError = signal<string | null>(null);
  private readonly _messageCount = signal<number>(0);
  private readonly _connectionStartTime = signal<Date | null>(null);
  private readonly _reconnectCount = signal<number>(0);
  private readonly _lastPingTime = signal<Date | null>(null);

  // Charge point update signal
  private readonly _chargePointUpdate = signal<{ chargePointId: string; connectorId?: number; timestamp: Date } | null>(null);

  // Public readonly signals
  readonly connectionState = this._connectionState.asReadonly();
  readonly lastMessage = this._lastMessage.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly messageCount = this._messageCount.asReadonly();
  readonly connectionStartTime = this._connectionStartTime.asReadonly();
  readonly reconnectCount = this._reconnectCount.asReadonly();
  readonly lastPingTime = this._lastPingTime.asReadonly();
  readonly chargePointUpdate = this._chargePointUpdate.asReadonly();

  readonly isConnected = computed(() =>
    this._connectionState() === ConnectionState.Connected
  );

  // Message broadcasting
  private messageSubject = new Subject<WsResponse>();

  // Public observable for direct subscription with takeUntilDestroyed
  readonly messages$ = this.messageSubject.asObservable();

  // Reconnection state
  private reconnectTimeout: any = null;
  private currentReconnectDelay: number = APP_CONSTANTS.WEBSOCKET.RECONNECT_INITIAL_DELAY;
  private pingInterval: any = null;

  // Visibility state
  private isTabVisible: boolean = true;

  // Debug mode
  private debug = true;

  constructor() {
    // Set up visibility change handler
    this.setupVisibilityHandler();

    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Set up browser visibility change handler
   */
  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;

      if (this.isTabVisible) {
        // Tab became visible - resume ping if connected
        if (this.isConnected() && !this.pingInterval) {
          this.startPing();
        }
      } else {
        // Tab became hidden - pause ping to save resources
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      }
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    // Don't reconnect if already connected or connecting
    if (this._connectionState() === ConnectionState.Connected ||
        this._connectionState() === ConnectionState.Connecting) {
      if (this.debug) console.log('[WebSocket] Already connected or connecting');
      return;
    }

    try {
      this._connectionState.set(ConnectionState.Connecting);
      this._lastError.set(null);

      this.ws = new WebSocket(environment.wsBaseUrl);

      // Set up event handlers
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);

    } catch (error: any) {
      if (this.debug) console.error('[WebSocket] Connection error:', error);
      this._lastError.set(error.message || 'Failed to connect');
      this._connectionState.set(ConnectionState.Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.debug) console.log('[WebSocket] Disconnecting');

    // Clear reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close WebSocket connection
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }

    this._connectionState.set(ConnectionState.Disconnected);
    this._connectionStartTime.set(null);
  }

  /**
   * Send a message to the server
   */
  async send(request: Partial<UserRequest>): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    try {
      // Get fresh Firebase token
      const token = await this.authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Add token to request
      const fullRequest: UserRequest = {
        ...request,
        token,
        command: request.command!
      };

      const message = JSON.stringify(fullRequest);

      // Log all commands except pings to reduce console clutter
      if (this.debug && request.command !== WsCommand.PingConnection) {
        console.log('[WebSocket] >>', request.command);
      }

      this.ws.send(message);
    } catch (error: any) {
      if (this.debug) console.error('[WebSocket] Send error:', error);
      this._lastError.set(error.message || 'Failed to send message');
      throw error;
    }
  }

  /**
   * Send a command with optional parameters
   */
  async sendCommand(command: WsCommand, params?: Partial<UserRequest>): Promise<void> {
    return this.send({
      ...params,
      command
    });
  }

  /**
   * Subscribe to all incoming messages
   */
  subscribe(callback: (message: WsResponse) => void): Subscription {
    return this.messageSubject.subscribe(callback);
  }

  /**
   * Subscribe to messages with specific status
   */
  subscribeToStatus(status: ResponseStatus, callback: (message: WsResponse) => void): Subscription {
    return this.messageSubject
      .pipe(filter(message => message.status === status))
      .subscribe(callback);
  }

  /**
   * Subscribe to messages with specific stage
   */
  subscribeToStage(stage: ResponseStage, callback: (message: WsResponse) => void): Subscription {
    return this.messageSubject
      .pipe(filter(message => message.stage === stage))
      .subscribe(callback);
  }

  /**
   * Handle WebSocket open event
   */
  private async handleOpen(): Promise<void> {
    if (this.debug) console.log('[WebSocket] Connected');

    this._connectionState.set(ConnectionState.Connected);
    this._connectionStartTime.set(new Date());
    this._lastError.set(null);

    // Reset reconnection delay
    this.currentReconnectDelay = APP_CONSTANTS.WEBSOCKET.RECONNECT_INITIAL_DELAY;

    // Start periodic ping
    this.startPing();

    // Wait for authentication token before sending initial messages
    await this.sendInitialMessages();
  }

  /**
   * Send initial messages after connection is established
   * Waits for authentication token to be available
   */
  private async sendInitialMessages(): Promise<void> {
    try {
      // Check if token is available
      const token = await this.authService.getToken();

      if (!token) {
        if (this.debug) {
          console.log('[WebSocket] No authentication token available yet, skipping initial messages');
        }
        return;
      }

      // Send initial ping
      await this.sendCommand(WsCommand.PingConnection).catch(error => {
        // Silently fail - ping errors are not critical
      });

      // If this was a reconnection, send CheckStatus to resume state
      if (this._reconnectCount() > 0) {
        await this.sendCommand(WsCommand.CheckStatus).catch(error => {
          if (this.debug) console.error('[WebSocket] CheckStatus failed:', error);
        });
      }
    } catch (error) {
      if (this.debug) {
        console.log('[WebSocket] Could not send initial messages, token not available:', error);
      }
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WsResponse = JSON.parse(event.data);

      // Log all messages except pings to reduce console clutter
      if (this.debug && message.status !== ResponseStatus.Ping) {
        console.log('[WebSocket] << ', message);
      }

      // Update state
      this._lastMessage.set(message);
      this._messageCount.update(count => count + 1);

      // Handle ping response
      if (message.status === ResponseStatus.Ping) {
        this._lastPingTime.set(new Date());
      }

      // Handle charge point events - update signal for reactive components
      if (message.stage === ResponseStage.ChargePointEvent && message.data) {
        this._chargePointUpdate.set({
          chargePointId: message.data,
          connectorId: message.connector_id,
          timestamp: new Date()
        });
      }

      // Broadcast to subscribers
      this.messageSubject.next(message);

    } catch (error: any) {
      if (this.debug) console.error('[WebSocket] Message parse error:', error);
      this._lastError.set('Failed to parse message');
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    if (this.debug) console.error('[WebSocket] Error:', error);
    this._lastError.set('WebSocket error occurred');
    this._connectionState.set(ConnectionState.Error);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    if (this.debug) console.log('[WebSocket] Closed:', event.code, event.reason);

    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Only reconnect if not manually disconnected
    if (this._connectionState() !== ConnectionState.Disconnected) {
      this._connectionState.set(ConnectionState.Disconnected);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }

    this._connectionState.set(ConnectionState.Reconnecting);
    this._reconnectCount.update(count => count + 1);

    if (this.debug) {
      console.log(
        `[WebSocket] Scheduling reconnect in ${this.currentReconnectDelay}ms (attempt ${this._reconnectCount()})`
      );
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.currentReconnectDelay);

    // Exponential backoff
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 2,
      APP_CONSTANTS.WEBSOCKET.RECONNECT_MAX_DELAY
    );
  }

  /**
   * Start periodic ping
   */
  private startPing(): void {
    // Clear existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Send ping every PING_INTERVAL
    this.pingInterval = setInterval(async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // Check if token is available before sending ping
          const token = await this.authService.getToken();
          if (token) {
            await this.sendCommand(WsCommand.PingConnection);
          }
          // Silently skip ping if no token (user not authenticated)
        } catch (error: any) {
          // Silently fail - periodic ping errors are not critical
          // Connection issues will be caught by onclose event
        }
      }
    }, APP_CONSTANTS.WEBSOCKET.PING_INTERVAL);
  }

  /**
   * Get connection uptime in milliseconds
   */
  getUptime(): number {
    const startTime = this._connectionStartTime();
    if (!startTime) return 0;
    return Date.now() - startTime.getTime();
  }

  /**
   * Reset connection statistics
   */
  resetStats(): void {
    this._messageCount.set(0);
    this._reconnectCount.set(0);
    this._lastPingTime.set(null);
  }

  /**
   * Clear the charge point update signal
   * Useful for components that want to consume updates once
   */
  clearChargePointUpdate(): void {
    this._chargePointUpdate.set(null);
  }
}

