# WebSocket Implementation Plan

## Overview
Implement WebSocket connection for real-time data updates with a test/debug page for admins, global connectivity monitoring, and integration with Dashboard, Active Sessions, and Station Details pages.

## Implementation Status
✅ **Phase 1**: Core WebSocket Infrastructure - COMPLETE  
✅ **Phase 2**: Admin Tools - WebSocket Test Page - COMPLETE  
✅ **Phase 3**: Global Connection Monitoring - COMPLETE  
⏸️ **Phase 4**: Real-Time Updates Integration - PENDING  
✅ **Phase 5**: Translations & Styling - COMPLETE

## Global Connection Strategy
The WebSocket connection is now **globally managed** and maintains a persistent connection:
- Connection established automatically in `MainLayoutComponent` on app startup
- Maintained throughout entire app lifecycle
- Automatically reconnects on network issues
- Token availability checked before sending any commands
- Browser visibility changes handled (pause/resume ping)
- **Components only need to subscribe to messages, not manage connections**

---

## Phase 1: Core WebSocket Infrastructure

### 1. Create WebSocket Models
**File**: `src/app/core/models/websocket.model.ts`

Define TypeScript interfaces matching backend message formats:

```typescript
// Command types that can be sent to the server
export enum WsCommand {
  StartTransaction = 'StartTransaction',
  StopTransaction = 'StopTransaction',
  CheckStatus = 'CheckStatus',
  ListenTransaction = 'ListenTransaction',
  StopListenTransaction = 'StopListenTransaction',
  ListenChargePoints = 'ListenChargePoints',
  ListenLog = 'ListenLog',
  PingConnection = 'PingConnection'
}

// Client → Server message format
export interface UserRequest {
  token: string;
  charge_point_id?: string;
  connector_id?: number;
  transaction_id?: number;
  command: WsCommand;
}

// Response status enum
export enum ResponseStatus {
  Success = 'success',
  Error = 'error',
  Waiting = 'waiting',
  Ping = 'ping',
  Value = 'value',
  Event = 'event'
}

// Response stage enum
export enum ResponseStage {
  Start = 'start',
  Stop = 'stop',
  Info = 'info',
  LogEvent = 'log-event',
  ChargePointEvent = 'charge-point-event'
}

// Transaction meter data
export interface TransactionMeter {
  [key: string]: any; // Backend structure to be determined during testing
}

// Server → Client message format
export interface WsResponse {
  status: ResponseStatus;
  stage: ResponseStage;
  info?: string;
  user_id?: string;
  progress?: number;
  power?: number;
  power_rate?: number;
  soc?: number;
  price?: number;
  minute?: number;
  id?: number;
  data?: string;
  connector_id?: number;
  connector_status?: string;
  meter_value?: TransactionMeter;
}

// Connection state enum
export enum ConnectionState {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  Reconnecting = 'reconnecting',
  Error = 'error'
}

// Subscription types
export enum SubscriptionType {
  ChargePointEvent = 'charge-point-event',
  LogEvent = 'log-event',
  Broadcast = 'broadcast'
}
```

---

### 2. Create WebSocket Service
**File**: `src/app/core/services/websocket.service.ts`

Implement singleton service with the following features:

**State Management (Signals)**:
- `connectionState`: Signal<ConnectionState>
- `lastMessage`: Signal<WsResponse | null>
- `lastError`: Signal<string | null>
- `isConnected`: Computed<boolean> (derived from connectionState)
- `messageCount`: Signal<number> (total messages received)
- `connectionStartTime`: Signal<Date | null>

**Core Methods**:
- `connect()`: Promise<void>
  - Connect to `environment.wsBaseUrl`
  - Set up message handlers
  - Send initial ping
  - Update connectionState signal
- `disconnect()`: void
  - Clean close connection
  - Clear subscriptions
  - Update state
- `send(request: UserRequest)`: Promise<void>
  - Get fresh Firebase token via `AuthService.getToken()`
  - Add token to request
  - Send JSON message
  - Handle send errors
- `sendCommand(command: WsCommand, params?: Partial<UserRequest>)`: Promise<void>
  - Helper method to send commands with less boilerplate
- `subscribe(callback: (message: WsResponse) => void)`: Subscription
  - Subscribe to all incoming messages
  - Return unsubscribe function
- `subscribeToStatus(status: ResponseStatus, callback: (message: WsResponse) => void)`: Subscription
  - Filter by specific status
- `subscribeToStage(stage: ResponseStage, callback: (message: WsResponse) => void)`: Subscription
  - Filter by specific stage

**Auto-Reconnection Logic**:
- Use exponential backoff: start at 1s, double each attempt, max 30s
- Reset backoff on successful connection
- On reconnect, send `CheckStatus` command to resume state
- Max reconnection attempts: unlimited (keep trying)

**Periodic Ping**:
- Send `PingConnection` command every 30 seconds
- Update last ping time
- Use to detect connection health

**Message Handling**:
- Parse JSON messages
- Validate against WsResponse interface
- Update lastMessage signal
- Emit to subscribers
- Handle special message types (ping response, errors)

**Connection Lifecycle**:
- Track WebSocket readyState
- Handle onopen, onclose, onerror, onmessage events
- Clean up resources on destroy
- Proper RxJS subscription management

**Implementation Notes**:
- Use RxJS Subject for message broadcasting
- Inject AuthService for token management
- Use environment.wsBaseUrl for endpoint
- Handle browser visibility changes (pause/resume ping) ✅ IMPLEMENTED
- Log all WebSocket events to console (debug mode) ✅ IMPLEMENTED
- Check token availability before sending commands ✅ IMPLEMENTED
- Silently skip commands when user is not authenticated ✅ IMPLEMENTED

**Global Connection Management** ✅ IMPLEMENTED:
- Connection initialized in `MainLayoutComponent.ngOnInit()`
- Persistent connection maintained throughout app lifecycle
- Components subscribe to messages but don't manage connection
- No need to call `connect()` in individual components

---

### 3. Update Constants
**File**: `src/app/core/constants/app.constants.ts`

Add WebSocket configuration:
```typescript
WEBSOCKET: {
  PING_INTERVAL: 30000, // 30 seconds
  RECONNECT_INITIAL_DELAY: 1000, // 1 second
  RECONNECT_MAX_DELAY: 30000, // 30 seconds
  MESSAGE_HISTORY_LIMIT: 100, // For test page
}
```

---

## Phase 2: Admin Tools - WebSocket Test Page

### 4. Create Tools Routes
**File**: `src/app/features/tools/tools.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const toolsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'websocket',
    pathMatch: 'full'
  },
  {
    path: 'websocket',
    loadComponent: () => import('./websocket-test/websocket-test.component')
      .then(m => m.WebsocketTestComponent),
    canActivate: [roleGuard(['admin'])]
  }
];
```

---

### 5. Create WebSocket Test Component
**Files**: 
- `src/app/features/tools/websocket-test/websocket-test.component.ts`
- `src/app/features/tools/websocket-test/websocket-test.component.html`
- `src/app/features/tools/websocket-test/websocket-test.component.scss`

**Component Structure** (`websocket-test.component.ts`):

**Imports**:
- Material: Card, Button, Icon, Expansion Panel, Chip, Badge, Form Field, Input, Select, Divider, Tabs
- Reactive Forms: FormGroup, FormBuilder, Validators
- WebSocketService, SimpleTranslationService

**Signals**:
- `messages`: Signal<WsResponse[]> - history of received messages (max 100)
- `selectedMessage`: Signal<WsResponse | null> - for inspector panel
- `commandForm`: FormGroup - reactive form for sending commands
- `selectedCommand`: Signal<WsCommand>
- `filterStatus`: Signal<ResponseStatus | 'all'>
- `filterStage`: Signal<ResponseStage | 'all'>
- `autoScroll`: Signal<boolean> - toggle auto-scroll
- `connectionStats`: Computed signal with uptime, message count, reconnect count

**Methods**:
- `ngOnInit()`: Auto-connect to WebSocket, subscribe to messages
- `ngOnDestroy()`: Clean up subscriptions, optionally disconnect
- `connect()`: Manually connect
- `disconnect()`: Manually disconnect
- `sendCommand()`: Send command from form
- `selectMessage(message)`: Show in inspector panel
- `clearLog()`: Clear message history
- `exportLog()`: Download messages as JSON file
- `copyMessage(message)`: Copy JSON to clipboard
- `getStatusColor(status)`: Return color class for status badge
- `getStageIcon(stage)`: Return icon for stage type
- `formatTimestamp(date)`: Format date/time for display
- `formatJSON(obj)`: Pretty print JSON with indentation

**UI Layout** (`websocket-test.component.html`):

1. **Header Section**:
   - Title: "WebSocket Test & Monitor"
   - Connection status badge (colored based on state)
   - Connect/Disconnect buttons
   - Connection info: duration, message count, last ping

2. **Main Content** (3-column grid):
   
   **Left Panel - Command Center**:
   - Command selector dropdown (all WsCommand options)
   - Dynamic form fields based on selected command:
     - StartTransaction: charge_point_id (text), connector_id (number)
     - StopTransaction: transaction_id (number)
     - ListenTransaction: transaction_id (number)
     - StopListenTransaction: transaction_id (number)
     - CheckStatus, PingConnection, ListenChargePoints, ListenLog: no fields
   - Send button (disabled when disconnected)
   - Quick action buttons section:
     - "Send Ping"
     - "Listen Charge Points"
     - "Listen Logs"
   - Subscription status indicator (current subscription type)

   **Center Panel - Message Log**:
   - Filter controls:
     - Status filter dropdown (all, success, error, waiting, ping, value, event)
     - Stage filter dropdown (all, start, stop, info, log-event, charge-point-event)
     - Auto-scroll checkbox
   - Scrollable message list:
     - Each message card shows:
       - Timestamp (HH:mm:ss.SSS)
       - Status badge (colored)
       - Stage chip
       - Info text
       - Key fields (transaction_id, progress, power, soc, etc.)
       - Click to select for inspector
   - Footer controls:
     - Message count: "234 messages"
     - Clear log button
     - Export log button

   **Right Panel - Message Inspector**:
   - Selected message details (or "No message selected")
   - Formatted JSON display with syntax highlighting:
     - Keys in blue
     - Strings in green
     - Numbers in orange
     - Booleans in purple
   - Parsed field display (user-friendly):
     - Transaction ID: 4567
     - Progress: 42%
     - Power: 7.2 kW
     - State of Charge: 52%
     - Price: €24.50
   - Copy JSON button

3. **Statistics Section** (bottom):
   - Connection uptime
   - Total messages received
   - Messages by status (breakdown)
   - Messages by stage (breakdown)
   - Reconnection count

**Styling** (`websocket-test.component.scss`):
- Responsive grid layout (collapses to single column on mobile)
- Fixed height panels with scrolling
- Monospace font for JSON
- Color-coded badges:
  - success: green (#4caf50)
  - error: red (#f44336)
  - waiting: orange (#ff9800)
  - ping: blue (#2196f3)
  - value: cyan (#00bcd4)
  - event: purple (#9c27b0)
- Smooth animations for message additions
- Highlight selected message

---

### 6. Update App Routes
**File**: `src/app/app.routes.ts`

Add after profile route:
```typescript
{
  path: 'tools',
  loadChildren: () => import('./features/tools/tools.routes').then(m => m.toolsRoutes)
}
```

---

### 7. Update Main Layout Navigation ✅ COMPLETE
**File**: `src/app/layouts/main-layout/main-layout.component.ts`

Add computed signal:
```typescript
protected readonly isAdmin = computed(() => 
  this.authService.hasAnyRole(['admin'])
);
```

**Initialize WebSocket Connection** ✅ IMPLEMENTED:
```typescript
private initializeWebSocket(): void {
  // Connect to WebSocket server
  // Connection is maintained throughout app lifecycle
  this.websocketService.connect();
  console.log('[MainLayout] WebSocket connection initialized');
}

ngOnInit(): void {
  // Initialize translations first
  this.initializeTranslations();
  
  // Initialize WebSocket connection for real-time updates
  this.initializeWebSocket();
}
```

**File**: `src/app/layouts/main-layout/main-layout.component.html`

Add connection status component and menu item:
```html
<main class="main-content">
  <app-connection-status></app-connection-status>
  <router-outlet></router-outlet>
</main>

<!-- In sidenav (after profile item): -->
<a mat-list-item routerLink="/tools" (click)="closeSidenav()" *ngIf="isAdmin()">
  <mat-icon matListItemIcon>build</mat-icon>
  <span matListItemTitle>{{ translationService.getReactive('nav.tools') }}</span>
</a>
```

---

## Phase 3: Global Connection Monitoring ✅ COMPLETE

### 8. Create Connection Status Component ✅ COMPLETE
**Files**:
- `src/app/shared/components/connection-status/connection-status.component.ts`
- `src/app/shared/components/connection-status/connection-status.component.html`
- `src/app/shared/components/connection-status/connection-status.component.scss`

**Component** (`connection-status.component.ts`):
- Inject WebSocketService
- Subscribe to `connectionState` signal
- Show banner only when state is 'disconnected' or 'reconnecting'
- Signals:
  - `showBanner`: Computed<boolean> (true when disconnected/reconnecting)
  - `connectionState`: from service
  - `dismissed`: Signal<boolean> (user dismissed banner)
- Methods:
  - `dismiss()`: Hide banner until next disconnect
  - Auto-show when reconnecting after dismiss

**Template** (`connection-status.component.html`):
```html
<div class="connection-warning" *ngIf="showBanner() && !dismissed()">
  <mat-icon>cloud_off</mat-icon>
  <span>{{ translationService.getReactive('connection.warning') }}</span>
  <mat-spinner diameter="20" *ngIf="connectionState() === 'reconnecting'"></mat-spinner>
  <button mat-icon-button (click)="dismiss()">
    <mat-icon>close</mat-icon>
  </button>
</div>
```

**Styling** (`connection-status.component.scss`):
- Position: fixed, top: 64px (below toolbar), width: 100%, z-index: 1000
- Background: warning color (orange/yellow)
- Display: flex, align-items: center, padding: 12px 24px
- Smooth slide-in/out animation
- Box shadow for elevation

---

### 9. Integrate Connection Status in Main Layout ✅ COMPLETE
**File**: `src/app/layouts/main-layout/main-layout.component.html`

Add before router-outlet in main content:
```html
<main class="main-content">
  <app-connection-status></app-connection-status>
  <router-outlet></router-outlet>
</main>
```

Import component in `main-layout.component.ts`:
```typescript
import { ConnectionStatusComponent } from '../../shared/components/connection-status/connection-status.component';

// Add to imports array in @Component decorator
```

---

## Phase 4: Real-Time Updates Integration

> **Note**: WebSocket connection is now globally managed in `MainLayoutComponent`.  
> Components only need to **subscribe to messages**, not manage connections.

### 10. Dashboard Real-Time Updates
**File**: `src/app/features/dashboard/dashboard.component.ts`

**Changes**:
1. Inject WebSocketService
2. Add signal for real-time indicator: `realtimeActive = signal(false)`
3. In `ngOnInit()`:
   ```typescript
   // Note: WebSocket is already connected globally
   // No need to call connect()
   
   // Subscribe to charge-point events
   this.websocketService.sendCommand(WsCommand.ListenChargePoints);
   
   // Listen for events
   this.websocketSubscription = this.websocketService.subscribeToStage(
     ResponseStage.ChargePointEvent,
     (message) => {
       this.handleChargePointEvent(message);
     }
   );
   ```
4. Add method:
   ```typescript
   private handleChargePointEvent(message: WsResponse): void {
     // Parse charge point ID from message.data
     const chargePointId = message.data;
     
     // Refresh charge point data or update specific charge point
     this.chargePointService.refreshChargePoint(chargePointId);
     
     // Set real-time indicator
     this.realtimeActive.set(true);
     setTimeout(() => this.realtimeActive.set(false), 2000); // Flash indicator
   }
   ```
5. In `ngOnDestroy()`: unsubscribe from WebSocket messages
6. Add real-time indicator in template (small pulsing dot)

---

### 11. Station Detail Real-Time Updates
**File**: `src/app/features/stations/station-detail/station-detail.component.ts`

**Changes**:
1. Inject WebSocketService
2. Add signals:
   - `realtimeActive = signal(false)`
   - `updatedConnectorIds = signal<Set<number>>(new Set())`
3. After loading station detail:
   ```typescript
   // Note: WebSocket is already connected globally
   // No need to call connect()
   
   // Subscribe to charge-point events
   this.websocketService.sendCommand(WsCommand.ListenChargePoints);
   
   // Listen for events
   this.websocketSubscription = this.websocketService.subscribeToStage(
     ResponseStage.ChargePointEvent,
     (message) => {
       this.handleChargePointEvent(message);
     }
   );
   ```
4. Add method:
   ```typescript
   private handleChargePointEvent(message: WsResponse): void {
     const chargePointId = message.data;
     
     // Only handle events for this station
     if (chargePointId === this.stationDetail()?.charge_point_id) {
       // Refresh station detail
       this.loadStationDetail();
       
       // Highlight updated connector if connector_id present
       if (message.connector_id) {
         this.highlightConnector(message.connector_id);
       }
       
       // Set real-time indicator
       this.realtimeActive.set(true);
       setTimeout(() => this.realtimeActive.set(false), 2000);
     }
   }
   
   private highlightConnector(connectorId: number): void {
     this.updatedConnectorIds.update(set => {
       set.add(connectorId);
       return set;
     });
     
     // Remove highlight after 3 seconds
     setTimeout(() => {
       this.updatedConnectorIds.update(set => {
         set.delete(connectorId);
         return set;
       });
     }, 3000);
   }
   ```
5. In template: add CSS class binding for highlighted connectors with pulse animation

---

### 12. Active Session Real-Time Updates (Future - Preparation)
**File**: `src/app/core/services/transaction.service.ts`

Add methods (with TODO comments):
```typescript
/**
 * Start listening to real-time updates for a transaction
 * TODO: Implement when active session component is created
 */
listenToTransaction(transactionId: number): void {
  // this.websocketService.sendCommand(WsCommand.ListenTransaction, { transaction_id: transactionId });
  
  // Subscribe to value updates
  // this.websocketService.subscribeToStatus(ResponseStatus.Value, (message) => {
  //   if (message.id === transactionId) {
  //     this.updateTransactionMetrics(message);
  //   }
  // });
}

/**
 * Stop listening to transaction updates
 */
stopListeningToTransaction(transactionId: number): void {
  // this.websocketService.sendCommand(WsCommand.StopListenTransaction, { transaction_id: transactionId });
}

/**
 * Update transaction metrics from WebSocket message
 */
private updateTransactionMetrics(message: WsResponse): void {
  // Update signals:
  // - power (in kW)
  // - power_rate (in kW)
  // - soc (state of charge %)
  // - price (in currency)
  // - minute (duration in minutes)
  // - connector_status
}
```

Add signals to store real-time transaction data:
```typescript
private readonly _activeTransactionMetrics = signal<{
  power: number;
  powerRate: number;
  soc: number;
  price: number;
  duration: number;
  status: string;
} | null>(null);

readonly activeTransactionMetrics = this._activeTransactionMetrics.asReadonly();
```

---

## Phase 5: Translations & Styling

### 13. Add Translations

**File**: `src/assets/i18n/en.json`

Add to navigation section:
```json
"nav": {
  "tools": "Tools"
}
```

Add new tools section:
```json
"tools": {
  "websocket": {
    "title": "WebSocket Test & Monitor",
    "connection": {
      "connected": "Connected",
      "disconnected": "Disconnected",
      "connecting": "Connecting...",
      "reconnecting": "Reconnecting...",
      "error": "Connection Error",
      "duration": "Connected for {{duration}}",
      "lastPing": "Last ping: {{time}}"
    },
    "commands": {
      "title": "Send Command",
      "select": "Select Command",
      "startTransaction": "Start Transaction",
      "stopTransaction": "Stop Transaction",
      "checkStatus": "Check Status",
      "listenTransaction": "Listen Transaction",
      "stopListenTransaction": "Stop Listen Transaction",
      "listenChargePoints": "Listen Charge Points",
      "listenLog": "Listen Log",
      "pingConnection": "Ping Connection",
      "send": "Send Command",
      "quickActions": "Quick Actions"
    },
    "fields": {
      "chargePointId": "Charge Point ID",
      "connectorId": "Connector ID",
      "transactionId": "Transaction ID"
    },
    "messages": {
      "title": "Message Log",
      "count": "{{count}} messages",
      "noMessages": "No messages yet",
      "clear": "Clear Log",
      "export": "Export Log",
      "autoScroll": "Auto-scroll",
      "filter": "Filter"
    },
    "inspector": {
      "title": "Message Inspector",
      "noSelection": "Select a message to inspect",
      "copy": "Copy JSON",
      "copied": "Copied to clipboard"
    },
    "statistics": {
      "title": "Statistics",
      "uptime": "Uptime",
      "totalMessages": "Total Messages",
      "byStatus": "By Status",
      "byStage": "By Stage",
      "reconnections": "Reconnections"
    }
  }
}
```

Add connection warning:
```json
"connection": {
  "warning": "Real-time connection lost. Reconnecting...",
  "reconnecting": "Attempting to reconnect..."
}
```

**File**: `src/assets/i18n/es.json`

Add Spanish translations:
```json
"nav": {
  "tools": "Herramientas"
}
```

```json
"tools": {
  "websocket": {
    "title": "Prueba y Monitor WebSocket",
    "connection": {
      "connected": "Conectado",
      "disconnected": "Desconectado",
      "connecting": "Conectando...",
      "reconnecting": "Reconectando...",
      "error": "Error de Conexión",
      "duration": "Conectado durante {{duration}}",
      "lastPing": "Último ping: {{time}}"
    },
    "commands": {
      "title": "Enviar Comando",
      "select": "Seleccionar Comando",
      "startTransaction": "Iniciar Transacción",
      "stopTransaction": "Detener Transacción",
      "checkStatus": "Verificar Estado",
      "listenTransaction": "Escuchar Transacción",
      "stopListenTransaction": "Dejar de Escuchar Transacción",
      "listenChargePoints": "Escuchar Puntos de Carga",
      "listenLog": "Escuchar Registro",
      "pingConnection": "Ping de Conexión",
      "send": "Enviar Comando",
      "quickActions": "Acciones Rápidas"
    },
    "fields": {
      "chargePointId": "ID de Punto de Carga",
      "connectorId": "ID de Conector",
      "transactionId": "ID de Transacción"
    },
    "messages": {
      "title": "Registro de Mensajes",
      "count": "{{count}} mensajes",
      "noMessages": "Aún no hay mensajes",
      "clear": "Limpiar Registro",
      "export": "Exportar Registro",
      "autoScroll": "Desplazamiento automático",
      "filter": "Filtrar"
    },
    "inspector": {
      "title": "Inspector de Mensajes",
      "noSelection": "Seleccione un mensaje para inspeccionar",
      "copy": "Copiar JSON",
      "copied": "Copiado al portapapeles"
    },
    "statistics": {
      "title": "Estadísticas",
      "uptime": "Tiempo activo",
      "totalMessages": "Total de Mensajes",
      "byStatus": "Por Estado",
      "byStage": "Por Etapa",
      "reconnections": "Reconexiones"
    }
  }
}
```

```json
"connection": {
  "warning": "Conexión en tiempo real perdida. Reconectando...",
  "reconnecting": "Intentando reconectar..."
}
```

---

### 14. Styling Guidelines

**WebSocket Test Page**:
- Use Angular Material theming
- 3-column responsive grid:
  - Desktop: 25% | 45% | 30%
  - Tablet: 30% | 70% (inspector below)
  - Mobile: 100% stacked with tabs
- Panel heights: fixed with internal scrolling
- Monospace font for JSON: `'Courier New', Courier, monospace`
- Syntax highlighting colors:
  - Keys: `#0066cc`
  - Strings: `#008000`
  - Numbers: `#ff8800`
  - Booleans: `#9c27b0`
  - Null: `#999999`

**Status Badge Colors**:
```scss
.status-badge {
  &.success { background-color: #4caf50; }
  &.error { background-color: #f44336; }
  &.waiting { background-color: #ff9800; }
  &.ping { background-color: #2196f3; }
  &.value { background-color: #00bcd4; }
  &.event { background-color: #9c27b0; }
}
```

**Connection Status Banner**:
```scss
.connection-warning {
  position: fixed;
  top: 64px; // Below toolbar
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #ff9800;
  color: white;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
```

**Real-Time Indicator** (for Dashboard/Station Detail):
```scss
.realtime-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

**Updated Connector Highlight**:
```scss
.connector-card.updated {
  animation: highlightPulse 2s ease-out;
  border: 2px solid #4caf50;
}

@keyframes highlightPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
}
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Create `websocket.model.ts` with all interfaces and enums
- [x] Create `websocket.service.ts` with connection management
- [x] Add WebSocket constants to `app.constants.ts`
- [x] Test service connection manually in browser console
- [x] Implement browser visibility change handling
- [x] Add token availability checks before sending commands
- [x] Initialize global connection in MainLayoutComponent

### Phase 2: Test Page ✅ COMPLETE
- [x] Create `tools.routes.ts` with route guard
- [x] Create WebSocket test component (3 files)
- [x] Implement command sending form
- [x] Implement message log with filtering
- [x] Implement message inspector panel
- [x] Add statistics display
- [x] Update app routes to include tools
- [x] Update main layout with admin menu item
- [x] Test all commands and verify responses
- [x] Fix timestamp change detection error

### Phase 3: Connection Monitoring ✅ COMPLETE
- [x] Create connection status component (3 files)
- [x] Implement show/hide logic based on connection state
- [x] Add to main layout above router-outlet
- [x] Test disconnect/reconnect scenarios
- [x] Add responsive styling for mobile devices

### Phase 4: Real-Time Integration ⏸️ PENDING
- [ ] Integrate WebSocket in dashboard component
- [ ] Subscribe to charge-point events in dashboard
- [ ] Add real-time indicator to dashboard UI
- [ ] Integrate WebSocket in station detail component
- [ ] Implement connector highlight on updates
- [ ] Add placeholder methods in transaction service

### Phase 5: Polish ✅ COMPLETE
- [x] Add all English translations
- [x] Add all Spanish translations
- [x] Apply styling to test page
- [x] Apply styling to connection banner
- [x] Add animations (pulse, highlight, slide)
- [x] Test responsive layout on mobile/tablet
- [ ] Test with real WebSocket server (backend dependent)

---

## Testing Strategy

### Manual Testing Steps

1. **WebSocket Service**:
   - Open browser console
   - Connect to WebSocket
   - Verify connection state changes
   - Send ping command
   - Verify response received
   - Disconnect and verify reconnection

2. **Test Page**:
   - Login as admin user
   - Navigate to Tools → WebSocket
   - Verify connection auto-starts
   - Test each command type:
     - PingConnection
     - ListenChargePoints
     - ListenLog
     - StartTransaction (if you have charge point ID)
     - CheckStatus
   - Verify messages appear in log
   - Test filters (status, stage)
   - Test message inspector
   - Test export log functionality
   - Test clear log
   - Test reconnection (close connection from backend)

3. **Connection Monitoring**:
   - Navigate to any page
   - Simulate disconnect (stop backend WebSocket server)
   - Verify warning banner appears
   - Dismiss banner
   - Verify reconnection when server restarts
   - Verify banner reappears on next disconnect

4. **Dashboard Integration**:
   - Navigate to dashboard
   - Verify WebSocket connects
   - Trigger charge point event from backend
   - Verify dashboard updates
   - Verify real-time indicator flashes

5. **Station Detail Integration**:
   - Navigate to station detail page
   - Verify WebSocket connects
   - Trigger charge point status change from backend
   - Verify connector status updates
   - Verify highlight animation on updated connector

### Edge Cases to Test
- Network interruption (airplane mode)
- Token expiration during WebSocket session
- Multiple tabs open (multiple WebSocket connections)
- Background tab behavior
- Server restart
- Invalid command parameters
- Large message volume (stress test)
- Concurrent commands

---

## Future Enhancements

1. **Active Session Page**:
   - Real-time transaction monitoring
   - Live energy consumption chart
   - Start/Stop transaction controls
   - Transaction progress indicator

2. **Notifications**:
   - Push notifications for events
   - Browser notification API integration
   - Custom notification preferences

3. **Advanced Filtering**:
   - Search messages by content
   - Date/time range filter
   - Save filter presets

4. **WebSocket Analytics**:
   - Message latency tracking
   - Connection quality metrics
   - Historical uptime chart

5. **Multi-Transaction Monitoring**:
   - Monitor multiple transactions simultaneously
   - Split-screen view
   - Comparison mode

---

## Security Considerations

1. **Authentication**:
   - Every WebSocket message includes fresh Firebase token
   - Token refresh handled automatically by AuthService
   - No token persistence in WebSocket service

2. **Authorization**:
   - Admin tool page protected by role guard
   - Backend validates token on every message
   - Commands restricted based on user role/permissions

3. **Data Privacy**:
   - No sensitive data logged to console in production
   - Message history cleared on logout
   - Exported logs sanitized

4. **Connection Security**:
   - Use WSS (WebSocket Secure) in production
   - TLS encryption for all messages
   - Origin validation on backend

---

## Dependencies

### NPM Packages (Already Available)
- `@angular/material` - UI components
- `@angular/fire` - Firebase authentication
- `rxjs` - Reactive programming
- TypeScript native WebSocket API (no additional package needed)

### No Additional Dependencies Required
The WebSocket implementation uses native browser WebSocket API, which is supported in all modern browsers.

---

## File Structure Summary

```
src/app/
├── core/
│   ├── constants/
│   │   └── app.constants.ts (modified)
│   ├── models/
│   │   └── websocket.model.ts (new)
│   ├── services/
│   │   └── websocket.service.ts (new)
│   └── guards/
│       └── role.guard.ts (already exists)
├── features/
│   ├── tools/
│   │   ├── tools.routes.ts (new)
│   │   └── websocket-test/
│   │       ├── websocket-test.component.ts (new)
│   │       ├── websocket-test.component.html (new)
│   │       └── websocket-test.component.scss (new)
│   ├── dashboard/
│   │   └── dashboard.component.ts (modified)
│   └── stations/
│       └── station-detail/
│           └── station-detail.component.ts (modified)
├── layouts/
│   └── main-layout/
│       ├── main-layout.component.ts (modified)
│       └── main-layout.component.html (modified)
├── shared/
│   └── components/
│       └── connection-status/
│           ├── connection-status.component.ts (new)
│           ├── connection-status.component.html (new)
│           └── connection-status.component.scss (new)
├── app.routes.ts (modified)
└── assets/
    └── i18n/
        ├── en.json (modified)
        └── es.json (modified)
```

**Total Files**:
- New: 9 files
- Modified: 7 files

---

## Estimated Implementation Time

- **Phase 1** (Core Infrastructure): 4-6 hours
- **Phase 2** (Test Page): 6-8 hours
- **Phase 3** (Connection Monitoring): 2-3 hours
- **Phase 4** (Real-Time Integration): 4-5 hours
- **Phase 5** (Translations & Styling): 2-3 hours

**Total**: 18-25 hours

---

## Notes

- This plan assumes the backend WebSocket server is already implemented and working according to `WEBSOCKET_DESCRIPTION.md`
- Test page is essential for understanding actual message formats and debugging
- Real-time updates will significantly improve user experience
- Admin-only test page prevents exposing technical details to regular users
- Connection monitoring provides transparency about system status
- Future active session page will heavily leverage WebSocket for live transaction monitoring

## Architecture Decisions

### Global Connection Strategy (Implemented)
**Decision**: Maintain a single, persistent WebSocket connection throughout the app lifecycle.

**Rationale**:
- Eliminates connection delays when navigating between pages
- Reduces server load (single connection per user vs multiple)
- Simplifies component code (subscribe only, no connection management)
- Enables instant real-time updates across all pages
- Better user experience with connection status banner

**Implementation**:
- Connection initialized in `MainLayoutComponent.ngOnInit()`
- Service cleanup handled by Angular's `DestroyRef`
- Token availability checked before sending commands
- Browser visibility changes handled gracefully
- Components only call `subscribe()` and `sendCommand()`

### Token-Aware Command Sending (Implemented)
**Decision**: Check authentication token availability before sending any WebSocket commands.

**Rationale**:
- Prevents errors on app startup before user is authenticated
- Allows unauthenticated users to receive public broadcasts
- Gracefully handles token expiration
- No error spam in console for normal operation

**Implementation**:
- `sendInitialMessages()` checks token before initial ping
- `startPing()` checks token before each periodic ping
- Commands silently skipped when no token available
- Works seamlessly when user logs in (no reconnection needed)

---

## Implementation Summary

### ✅ Completed (Phases 1-3, 5)

**Infrastructure**:
- WebSocket service with full state management using signals
- Global connection initialization in MainLayoutComponent
- Browser visibility change handling (pause/resume ping)
- Token availability checks before all commands
- Automatic reconnection with exponential backoff
- Clean resource management with DestroyRef

**Admin Tools**:
- Complete WebSocket test/monitor page for admins
- Real-time message log with filtering by status/stage
- Message inspector with JSON formatting
- Connection statistics and uptime tracking
- Manual connect/disconnect for testing
- Quick action buttons for common commands

**Global Monitoring**:
- Connection status banner component
- Automatic show/hide based on connection state
- Dismiss functionality with auto-reappear on reconnection
- Responsive design for mobile/tablet
- Smooth animations and transitions

**Internationalization**:
- Full English translations
- Full Spanish translations
- All UI text properly internationalized

### ⏸️ Pending (Phase 4)

**Real-Time Integration** - Ready to implement when needed:
- Dashboard real-time charge point updates
- Station detail live connector status
- Active session transaction monitoring
- Notification system for events

**Key Point**: All infrastructure is in place. Components only need to:
1. Inject `WebsocketService`
2. Call `sendCommand()` to subscribe to events
3. Call `subscribe()` or `subscribeToStage()` to receive updates
4. Handle incoming messages in their logic

No connection management needed in components!

