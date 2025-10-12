# WebSocket Implementation - Technical Guide

## Overview

This document describes the completed WebSocket implementation and provides technical guidance for integrating real-time updates into application components. The implementation follows Angular best practices with signals-based state management and a global connection strategy.

---

## Architecture

### Global Connection Strategy

The WebSocket connection is **globally managed** and maintains a single persistent connection throughout the application lifecycle:

- **Single Connection**: One WebSocket connection per user session
- **Automatic Management**: Connection established automatically on app startup
- **Persistent**: Maintained across all routes and page navigation
- **Auto-Reconnect**: Automatic reconnection with exponential backoff on network issues
- **Token-Aware**: Checks authentication before sending commands
- **Browser-Aware**: Handles visibility changes (pause/resume ping)

**Key Benefit**: Components only need to **subscribe to messages**, not manage connections.

---

## Core Components

### 1. WebSocket Service
**Location**: `src/app/core/services/websocket.service.ts`

Singleton service that manages the WebSocket connection and provides reactive state and messaging APIs.

#### State Signals

```typescript
// Connection state (connecting, connected, disconnected, reconnecting, error)
connectionState: Signal<ConnectionState>

// Last received message
lastMessage: Signal<WsResponse | null>

// Last connection error
lastError: Signal<string | null>

// Computed: true when connected
isConnected: Computed<boolean>

// Total messages received in current session
messageCount: Signal<number>

// Connection start timestamp
connectionStartTime: Signal<Date | null>

// Reconnection attempt counter
reconnectAttempts: Signal<number>
```

#### Core Methods

##### Connection Management

```typescript
// Connect to WebSocket server
// Note: Automatically called in MainLayoutComponent
// Components should NOT call this directly
connect(): Promise<void>

// Disconnect from WebSocket server
// Note: Handled automatically by service lifecycle
// Components should NOT call this directly
disconnect(): void
```

##### Sending Commands

```typescript
// Send a command to the server
// Automatically adds authentication token
sendCommand(
  command: WsCommand, 
  params?: {
    charge_point_id?: string;
    connector_id?: number;
    transaction_id?: number;
  }
): Promise<void>

// Example usage:
await this.websocketService.sendCommand(WsCommand.ListenChargePoints);

await this.websocketService.sendCommand(
  WsCommand.StartTransaction,
  { charge_point_id: 'CP001', connector_id: 1 }
);
```

##### Subscribing to Messages

```typescript
// Subscribe to ALL incoming messages
subscribe(callback: (message: WsResponse) => void): () => void

// Subscribe to messages with specific status
subscribeToStatus(
  status: ResponseStatus,
  callback: (message: WsResponse) => void
): () => void

// Subscribe to messages with specific stage
subscribeToStage(
  stage: ResponseStage,
  callback: (message: WsResponse) => void
): () => void

// Returns an unsubscribe function - MUST be called in ngOnDestroy
```

---

### 2. WebSocket Models
**Location**: `src/app/core/models/websocket.model.ts`

Complete TypeScript interfaces for WebSocket messages and state.

#### Command Types

```typescript
enum WsCommand {
  StartTransaction = 'StartTransaction',
  StopTransaction = 'StopTransaction',
  CheckStatus = 'CheckStatus',
  ListenTransaction = 'ListenTransaction',
  StopListenTransaction = 'StopListenTransaction',
  ListenChargePoints = 'ListenChargePoints',
  ListenLog = 'ListenLog',
  PingConnection = 'PingConnection'
}
```

#### Response Types

```typescript
enum ResponseStatus {
  Success = 'success',    // Command succeeded
  Error = 'error',        // Command failed
  Waiting = 'waiting',    // Waiting for charge point
  Ping = 'ping',          // Ping response
  Value = 'value',        // Real-time value update
  Event = 'event'         // Event notification
}

enum ResponseStage {
  Start = 'start',                          // Transaction started
  Stop = 'stop',                            // Transaction stopped
  Info = 'info',                            // General information
  LogEvent = 'log-event',                   // Log event
  ChargePointEvent = 'charge-point-event'   // Charge point status changed
}
```

#### Message Structure

```typescript
interface WsResponse {
  status: ResponseStatus;
  stage: ResponseStage;
  info?: string;                // Human-readable message
  user_id?: string;             // User ID
  progress?: number;            // Progress percentage (0-100)
  power?: number;               // Current power (kW)
  power_rate?: number;          // Power rate (kW)
  soc?: number;                 // State of charge (%)
  price?: number;               // Transaction price
  minute?: number;              // Duration in minutes
  id?: number;                  // Transaction ID
  data?: string;                // Additional data (charge_point_id, etc.)
  connector_id?: number;        // Connector ID
  connector_status?: string;    // Connector status
  meter_value?: TransactionMeter; // Meter readings
}
```

#### Connection State

```typescript
enum ConnectionState {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Reconnecting = 'reconnecting',
  Error = 'error'
}
```

---

### 3. Connection Status Component
**Location**: `src/app/shared/components/connection-status/connection-status.component.ts`

Global banner that displays connection warnings to users. Automatically shows/hides based on connection state.

**Features**:
- Shows when connection is lost
- Displays reconnection spinner
- User can dismiss (reappears on next disconnect)
- Positioned below toolbar
- Responsive design

**Usage**: Already integrated in `MainLayoutComponent`, no action needed in other components.

---

### 4. WebSocket Test Page (Admin Only)
**Location**: `src/app/features/tools/websocket-test/websocket-test.component.ts`

Comprehensive admin tool for testing and monitoring WebSocket connections.

**Features**:
- Real-time message log with filtering
- Message inspector with JSON formatting
- Command sending interface
- Connection statistics
- Manual connect/disconnect
- Export message logs
- Connection uptime tracking

**Access**: Navigate to `/tools/websocket` (admin role required)

---

## Integration Guide for Components

### Basic Pattern

Here's the standard pattern for integrating WebSocket in a component:

```typescript
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { WebsocketService } from '@core/services/websocket.service';
import { WsCommand, ResponseStage, WsResponse } from '@core/models/websocket.model';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  
  // Store unsubscribe function
  private wsUnsubscribe?: () => void;
  
  // Optional: track real-time activity
  protected readonly realtimeActive = signal(false);
  
  ngOnInit(): void {
    // 1. Send command to subscribe to events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    // 2. Subscribe to messages
    this.wsUnsubscribe = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => this.handleWebSocketMessage(message)
    );
  }
  
  ngOnDestroy(): void {
    // Clean up subscription
    this.wsUnsubscribe?.();
  }
  
  private handleWebSocketMessage(message: WsResponse): void {
    console.log('Received WebSocket message:', message);
    
    // Handle the message based on your needs
    // Example: refresh data, update UI, show notification
    
    // Flash real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000);
  }
}
```

---

## Common Use Cases

### Use Case 1: Dashboard - Listen to All Charge Point Events

Monitor all charge point status changes for real-time dashboard updates.

```typescript
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private readonly chargePointService = inject(ChargePointService);
  private wsUnsubscribe?: () => void;
  
  protected readonly realtimeActive = signal(false);
  
  ngOnInit(): void {
    // Subscribe to all charge point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    this.wsUnsubscribe = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => this.handleChargePointEvent(message)
    );
  }
  
  ngOnDestroy(): void {
    this.wsUnsubscribe?.();
  }
  
  private handleChargePointEvent(message: WsResponse): void {
    // Extract charge point ID from message
    const chargePointId = message.data;
    
    if (!chargePointId) return;
    
    // Refresh specific charge point or reload all
    this.chargePointService.refreshChargePoint(chargePointId);
    
    // Show real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000);
  }
}
```

**Template Addition**:
```html
<!-- Real-time indicator -->
@if (realtimeActive()) {
  <div class="realtime-indicator">
    <mat-icon>wifi</mat-icon>
    <span>Live</span>
  </div>
}
```

---

### Use Case 2: Station Detail - Monitor Specific Charge Point

Monitor a specific charge point and highlight updated connectors.

```typescript
export class StationDetailComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private readonly route = inject(ActivatedRoute);
  private wsUnsubscribe?: () => void;
  
  protected readonly stationDetail = signal<StationDetail | null>(null);
  protected readonly updatedConnectorIds = signal<Set<number>>(new Set());
  protected readonly realtimeActive = signal(false);
  
  ngOnInit(): void {
    // Load station detail first
    this.loadStationDetail();
    
    // Subscribe to charge point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    this.wsUnsubscribe = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => this.handleChargePointEvent(message)
    );
  }
  
  ngOnDestroy(): void {
    this.wsUnsubscribe?.();
  }
  
  private handleChargePointEvent(message: WsResponse): void {
    const chargePointId = message.data;
    const currentStation = this.stationDetail();
    
    // Only handle events for this station
    if (!currentStation || chargePointId !== currentStation.charge_point_id) {
      return;
    }
    
    // Reload station detail
    this.loadStationDetail();
    
    // Highlight updated connector if specified
    if (message.connector_id) {
      this.highlightConnector(message.connector_id);
    }
    
    // Show real-time indicator
    this.realtimeActive.set(true);
    setTimeout(() => this.realtimeActive.set(false), 2000);
  }
  
  private highlightConnector(connectorId: number): void {
    // Add connector to highlighted set
    this.updatedConnectorIds.update(set => {
      const newSet = new Set(set);
      newSet.add(connectorId);
      return newSet;
    });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      this.updatedConnectorIds.update(set => {
        const newSet = new Set(set);
        newSet.delete(connectorId);
        return newSet;
      });
    }, 3000);
  }
}
```

**Template Addition**:
```html
<!-- Connector card with highlight -->
@for (connector of station.connectors; track connector.id) {
  <mat-card 
    [class.connector-updated]="updatedConnectorIds().has(connector.id)">
    <!-- Connector details -->
  </mat-card>
}
```

**Styling**:
```scss
.connector-updated {
  animation: highlightPulse 2s ease-out;
  border: 2px solid #4caf50;
}

@keyframes highlightPulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); 
  }
  50% { 
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); 
  }
}
```

---

### Use Case 3: Active Session - Monitor Transaction Progress

Monitor real-time transaction metrics (power, SOC, price, duration).

```typescript
export class ActiveSessionComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private readonly route = inject(ActivatedRoute);
  private wsUnsubscribe?: () => void;
  
  protected readonly transactionId = signal<number | null>(null);
  protected readonly metrics = signal<{
    power: number;
    powerRate: number;
    soc: number;
    price: number;
    duration: number;
    status: string;
  } | null>(null);
  
  ngOnInit(): void {
    // Get transaction ID from route
    const id = this.route.snapshot.params['id'];
    this.transactionId.set(Number(id));
    
    // Subscribe to transaction updates
    this.websocketService.sendCommand(
      WsCommand.ListenTransaction,
      { transaction_id: id }
    );
    
    // Listen for value updates
    this.wsUnsubscribe = this.websocketService.subscribeToStatus(
      ResponseStatus.Value,
      (message) => this.handleValueUpdate(message)
    );
  }
  
  ngOnDestroy(): void {
    // Stop listening to transaction
    const id = this.transactionId();
    if (id) {
      this.websocketService.sendCommand(
        WsCommand.StopListenTransaction,
        { transaction_id: id }
      );
    }
    
    this.wsUnsubscribe?.();
  }
  
  private handleValueUpdate(message: WsResponse): void {
    // Only handle messages for this transaction
    if (message.id !== this.transactionId()) {
      return;
    }
    
    // Update metrics from message
    this.metrics.set({
      power: message.power ?? 0,
      powerRate: message.power_rate ?? 0,
      soc: message.soc ?? 0,
      price: message.price ?? 0,
      duration: message.minute ?? 0,
      status: message.connector_status ?? 'Unknown'
    });
  }
}
```

**Template**:
```html
@if (metrics(); as m) {
  <div class="metrics-grid">
    <div class="metric">
      <mat-icon>flash_on</mat-icon>
      <span class="value">{{ m.power }} kW</span>
      <span class="label">Current Power</span>
    </div>
    
    <div class="metric">
      <mat-icon>battery_charging_full</mat-icon>
      <span class="value">{{ m.soc }}%</span>
      <span class="label">State of Charge</span>
    </div>
    
    <div class="metric">
      <mat-icon>euro</mat-icon>
      <span class="value">{{ m.price | currency }}</span>
      <span class="label">Total Price</span>
    </div>
    
    <div class="metric">
      <mat-icon>schedule</mat-icon>
      <span class="value">{{ m.duration }} min</span>
      <span class="label">Duration</span>
    </div>
  </div>
}
```

---

### Use Case 4: Start/Stop Transaction with Status Updates

Initiate a transaction and monitor its progress through various stages.

```typescript
export class ChargeInitiationComponent {
  private readonly websocketService = inject(WebsocketService);
  private wsUnsubscribe?: () => void;
  
  protected readonly transactionStatus = signal<'idle' | 'starting' | 'active' | 'stopping' | 'error'>('idle');
  protected readonly statusMessage = signal<string>('');
  
  async startTransaction(chargePointId: string, connectorId: number): Promise<void> {
    this.transactionStatus.set('starting');
    this.statusMessage.set('Initiating charge...');
    
    // Subscribe to transaction start events
    this.wsUnsubscribe = this.websocketService.subscribe((message) => {
      this.handleTransactionMessage(message);
    });
    
    // Send start command
    await this.websocketService.sendCommand(
      WsCommand.StartTransaction,
      { charge_point_id: chargePointId, connector_id: connectorId }
    );
  }
  
  async stopTransaction(transactionId: number): Promise<void> {
    this.transactionStatus.set('stopping');
    this.statusMessage.set('Stopping charge...');
    
    await this.websocketService.sendCommand(
      WsCommand.StopTransaction,
      { transaction_id: transactionId }
    );
  }
  
  private handleTransactionMessage(message: WsResponse): void {
    switch (message.status) {
      case ResponseStatus.Waiting:
        this.statusMessage.set(message.info ?? 'Waiting for charge point...');
        break;
        
      case ResponseStatus.Success:
        if (message.stage === ResponseStage.Start) {
          this.transactionStatus.set('active');
          this.statusMessage.set('Charging started successfully!');
          // Navigate to active session or update UI
        } else if (message.stage === ResponseStage.Stop) {
          this.transactionStatus.set('idle');
          this.statusMessage.set('Charging stopped successfully!');
        }
        break;
        
      case ResponseStatus.Error:
        this.transactionStatus.set('error');
        this.statusMessage.set(message.info ?? 'An error occurred');
        break;
    }
  }
  
  ngOnDestroy(): void {
    this.wsUnsubscribe?.();
  }
}
```

---

### Use Case 5: Multiple Subscription Types

Subscribe to multiple message types in a single component.

```typescript
export class AdminMonitorComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private wsUnsubscribes: Array<() => void> = [];
  
  protected readonly chargePointEvents = signal<WsResponse[]>([]);
  protected readonly logEvents = signal<WsResponse[]>([]);
  
  ngOnInit(): void {
    // Subscribe to charge points
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    // Subscribe to logs
    this.websocketService.sendCommand(WsCommand.ListenLog);
    
    // Listen to charge point events
    const unsubChargePoints = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => {
        this.chargePointEvents.update(events => [...events, message]);
      }
    );
    
    // Listen to log events
    const unsubLogs = this.websocketService.subscribeToStage(
      ResponseStage.LogEvent,
      (message) => {
        this.logEvents.update(events => [...events, message]);
      }
    );
    
    // Store unsubscribe functions
    this.wsUnsubscribes.push(unsubChargePoints, unsubLogs);
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from all
    this.wsUnsubscribes.forEach(unsub => unsub());
  }
}
```

---

## Best Practices

### 1. Always Clean Up Subscriptions

```typescript
// ❌ BAD - Memory leak
ngOnInit(): void {
  this.websocketService.subscribe((message) => {
    // Handle message
  });
}

// ✅ GOOD - Proper cleanup
private wsUnsubscribe?: () => void;

ngOnInit(): void {
  this.wsUnsubscribe = this.websocketService.subscribe((message) => {
    // Handle message
  });
}

ngOnDestroy(): void {
  this.wsUnsubscribe?.();
}
```

### 2. Filter Messages Appropriately

```typescript
// ❌ BAD - Handle all messages and filter manually
this.websocketService.subscribe((message) => {
  if (message.stage === ResponseStage.ChargePointEvent && message.data === this.myChargePointId) {
    // Handle
  }
});

// ✅ GOOD - Use built-in filtering
this.websocketService.subscribeToStage(
  ResponseStage.ChargePointEvent,
  (message) => {
    if (message.data === this.myChargePointId) {
      // Handle
    }
  }
);
```

### 3. Don't Manage Connection in Components

```typescript
// ❌ BAD - Components should NOT manage connection
ngOnInit(): void {
  this.websocketService.connect();
  // Subscribe to messages
}

ngOnDestroy(): void {
  this.websocketService.disconnect();
}

// ✅ GOOD - Just subscribe to messages
ngOnInit(): void {
  // Connection is already active globally
  this.wsUnsubscribe = this.websocketService.subscribe(...);
}

ngOnDestroy(): void {
  this.wsUnsubscribe?.();
}
```

### 4. Handle Message Errors Gracefully

```typescript
private handleWebSocketMessage(message: WsResponse): void {
  try {
    if (message.status === ResponseStatus.Error) {
      console.error('WebSocket error:', message.info);
      this.showErrorNotification(message.info);
      return;
    }
    
    // Process message
    this.processMessage(message);
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
}
```

### 5. Use Signals for Reactive State

```typescript
// ✅ GOOD - Use signals for reactive updates
protected readonly metrics = signal<TransactionMetrics | null>(null);

private handleMessage(message: WsResponse): void {
  this.metrics.set({
    power: message.power ?? 0,
    soc: message.soc ?? 0,
    // ...
  });
}

// Template automatically updates
```

### 6. Check Connection State Before Actions

```typescript
protected canStartTransaction(): boolean {
  return this.websocketService.isConnected();
}

// In template
<button 
  [disabled]="!canStartTransaction()"
  (click)="startTransaction()">
  Start Charging
</button>
```

---

## Debugging

### Check Connection State

```typescript
// In component
console.log('Connection state:', this.websocketService.connectionState());
console.log('Is connected:', this.websocketService.isConnected());
console.log('Message count:', this.websocketService.messageCount());
```

### Monitor All Messages

```typescript
// Temporary debug subscription
ngOnInit(): void {
  this.websocketService.subscribe((message) => {
    console.log('[WebSocket Debug]', message);
  });
}
```

### Use Admin Test Page

Navigate to `/tools/websocket` (requires admin role) to:
- View all incoming messages in real-time
- Test commands manually
- Inspect message structure
- Export message logs
- Monitor connection statistics

### Browser Console Logs

The WebSocket service logs important events to console:
- Connection established
- Connection lost
- Reconnection attempts
- Command sent
- Errors

---

## Environment Configuration

### Development
**File**: `src/environments/environment.development.ts`

```typescript
export const environment = {
  wsBaseUrl: 'ws://localhost:8000/ws',
  // ... other config
};
```

### Production
**File**: `src/environments/environment.ts`

```typescript
export const environment = {
  wsBaseUrl: 'wss://api.yourapp.com/ws',
  // Use secure WebSocket (wss://)
};
```

---

## Security Considerations

### Authentication

Every WebSocket message automatically includes a **fresh Firebase authentication token**:
- Token retrieved via `AuthService.getToken()`
- Validated by backend on each message
- No manual token handling needed in components

### Token Expiration

The service handles token expiration gracefully:
- Checks token availability before sending
- Silently skips commands when not authenticated
- Works seamlessly when user logs in
- No errors for unauthenticated users

### Secure Connection

**Production**: Always use `wss://` (WebSocket Secure)
- TLS encryption
- Origin validation
- Same security as HTTPS

---

## Performance Tips

### 1. Limit Message History

Don't store unlimited messages in component state:

```typescript
// ✅ GOOD - Limit stored messages
private readonly MAX_MESSAGES = 100;

this.messages.update(msgs => {
  const updated = [...msgs, newMessage];
  return updated.slice(-this.MAX_MESSAGES);
});
```

### 2. Debounce UI Updates

For high-frequency updates (like real-time power values):

```typescript
import { debounceTime, Subject } from 'rxjs';

private readonly messageSubject = new Subject<WsResponse>();

ngOnInit(): void {
  // Debounce updates to 500ms
  this.messageSubject
    .pipe(debounceTime(500))
    .subscribe(message => this.updateUI(message));
    
  this.wsUnsubscribe = this.websocketService.subscribe(
    message => this.messageSubject.next(message)
  );
}
```

### 3. Unsubscribe When Not Needed

Stop listening to events when component is not visible:

```typescript
ngOnDestroy(): void {
  // Stop listening to specific transaction
  if (this.transactionId()) {
    this.websocketService.sendCommand(
      WsCommand.StopListenTransaction,
      { transaction_id: this.transactionId() }
    );
  }
  
  this.wsUnsubscribe?.();
}
```

---

## Testing

### Unit Testing WebSocket Integration

```typescript
import { TestBed } from '@angular/core/testing';
import { WebsocketService } from '@core/services/websocket.service';

describe('MyComponent', () => {
  let component: MyComponent;
  let websocketService: jasmine.SpyObj<WebsocketService>;
  
  beforeEach(() => {
    const wsServiceSpy = jasmine.createSpyObj('WebsocketService', [
      'sendCommand',
      'subscribe',
      'subscribeToStage'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: wsServiceSpy }
      ]
    });
    
    websocketService = TestBed.inject(WebsocketService) as jasmine.SpyObj<WebsocketService>;
    component = TestBed.createComponent(MyComponent).componentInstance;
  });
  
  it('should subscribe to charge point events', () => {
    component.ngOnInit();
    
    expect(websocketService.sendCommand)
      .toHaveBeenCalledWith(WsCommand.ListenChargePoints);
    expect(websocketService.subscribeToStage)
      .toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Connection Issues

**Problem**: WebSocket not connecting
- Check `environment.wsBaseUrl` is correct
- Verify backend WebSocket server is running
- Check browser console for error messages
- Test connection in admin test page (`/tools/websocket`)

**Problem**: Reconnection loop
- Check authentication token validity
- Verify backend accepts token format
- Check network connectivity
- Review backend WebSocket logs

### Message Handling

**Problem**: Not receiving messages
- Verify subscription is active (`wsUnsubscribe` is set)
- Check message filtering (status/stage)
- Confirm command was sent successfully
- Use admin test page to verify messages are arriving

**Problem**: Duplicate messages
- Check for multiple subscriptions
- Ensure proper cleanup in `ngOnDestroy()`
- Verify component lifecycle

### Performance Issues

**Problem**: UI lagging with many messages
- Implement debouncing for high-frequency updates
- Limit message history size
- Use `OnPush` change detection
- Consider virtual scrolling for message lists

---

## Support and Resources

### Documentation Files
- `WEBSOCKET_DESCRIPTION.md` - Backend WebSocket protocol specification
- `WEBSOCKET_IMPLEMENTATION_PLAN.md` - Complete implementation plan and checklist
- This file - Technical integration guide

### Admin Tools
- `/tools/websocket` - WebSocket test and monitoring page (admin only)

### Code Examples
- `WebsocketTestComponent` - Comprehensive example of all features
- `ConnectionStatusComponent` - Example of reactive connection state
- `MainLayoutComponent` - Global connection initialization

---

## Summary

### What You Need to Know

1. **Connection is Global**: Don't call `connect()` or `disconnect()` in components
2. **Just Subscribe**: Use `subscribe()`, `subscribeToStatus()`, or `subscribeToStage()`
3. **Always Clean Up**: Call unsubscribe function in `ngOnDestroy()`
4. **Use Signals**: Leverage Angular signals for reactive state
5. **Filter Appropriately**: Use built-in filtering methods for better performance

### Quick Start Template

```typescript
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { WebsocketService } from '@core/services/websocket.service';
import { WsCommand, ResponseStage } from '@core/models/websocket.model';

export class MyComponent implements OnInit, OnDestroy {
  private readonly websocketService = inject(WebsocketService);
  private wsUnsubscribe?: () => void;
  
  ngOnInit(): void {
    // 1. Send command
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    // 2. Subscribe
    this.wsUnsubscribe = this.websocketService.subscribeToStage(
      ResponseStage.ChargePointEvent,
      (message) => console.log('Message:', message)
    );
  }
  
  ngOnDestroy(): void {
    // 3. Clean up
    this.wsUnsubscribe?.();
  }
}
```

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Status**: ✅ Complete and ready for use
