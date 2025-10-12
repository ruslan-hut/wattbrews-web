# Charge Point Updates - Quick Reference

## For New Components

### Step 1: Import Dependencies

```typescript
import { Component, effect, inject } from '@angular/core';
import { WebsocketService } from '../core/services/websocket.service';
import { WsCommand } from '../core/models/websocket.model';
```

### Step 2: Inject WebSocket Service

```typescript
export class MyComponent {
  private readonly websocketService = inject(WebsocketService);
}
```

### Step 3: React to Updates (Choose One)

#### Option A: Signal Effect (Recommended)

```typescript
constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update) {
      console.log('Station updated:', update.chargePointId);
      console.log('Connector:', update.connectorId);
      
      // Refresh your data here
      this.refreshData();
    }
  });
}
```

#### Option B: RxJS Subscription

```typescript
private subscription?: Subscription;

ngOnInit() {
  this.subscription = this.websocketService.subscribeToStage(
    ResponseStage.ChargePointEvent,
    (message) => {
      console.log('Station updated:', message.data);
      this.refreshData();
    }
  );
}

ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

### Step 4: Subscribe to Charge Point Events

```typescript
ngOnInit() {
  // Tell the server you want to receive charge point updates
  this.websocketService.sendCommand(WsCommand.ListenChargePoints);
}
```

## Common Patterns

### Filter for Specific Station

```typescript
constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    const myStationId = this.currentStationId(); // Your station ID signal
    
    if (update && update.chargePointId === myStationId) {
      // Only update if it's YOUR station
      this.refreshData();
    }
  });
}
```

### Visual Feedback

```typescript
protected readonly updateIndicator = signal(false);

constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update) {
      // Show indicator
      this.updateIndicator.set(true);
      
      // Hide after 2 seconds
      setTimeout(() => this.updateIndicator.set(false), 2000);
    }
  });
}
```

In template:
```html
<div [class.updated]="updateIndicator()">
  <!-- Your content -->
</div>
```

### Debounce Rapid Updates

```typescript
private debounceTimer: any;

constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update) {
      // Clear previous timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      // Wait 500ms before updating
      this.debounceTimer = setTimeout(() => {
        this.refreshData();
      }, 500);
    }
  });
}
```

## Available Data

The `chargePointUpdate` signal provides:

```typescript
{
  chargePointId: string;    // Station ID (e.g., "Office1")
  connectorId?: number;     // Connector ID if specific connector updated
  timestamp: Date;          // When the update occurred
}
```

## WebSocket Message Format

```typescript
{
  status: 'event',
  stage: 'charge-point-event',
  data: 'Office1',           // Station ID
  connector_id?: 2,          // Optional: specific connector
  connector_status?: string, // Optional: connector status
  info?: string             // Optional: event description
}
```

## Complete Example Component

```typescript
import { Component, signal, effect, inject } from '@angular/core';
import { WebsocketService } from '../core/services/websocket.service';
import { ChargePointService } from '../core/services/chargepoint.service';
import { WsCommand } from '../core/models/websocket.model';

@Component({
  selector: 'app-my-station-component',
  template: `
    <div [class.updating]="isUpdating()">
      <h2>Station: {{ stationId }}</h2>
      @if (station(); as data) {
        <p>Status: {{ data.status }}</p>
      }
    </div>
  `
})
export class MyStationComponent {
  private readonly websocketService = inject(WebsocketService);
  private readonly chargePointService = inject(ChargePointService);
  
  protected readonly stationId = 'Office1';
  protected readonly station = signal<any>(null);
  protected readonly isUpdating = signal(false);
  
  constructor() {
    // React to charge point updates
    effect(() => {
      const update = this.websocketService.chargePointUpdate();
      
      if (update && update.chargePointId === this.stationId) {
        // Show update indicator
        this.isUpdating.set(true);
        
        // Refresh data
        this.loadStation();
        
        // Hide indicator after 2s
        setTimeout(() => this.isUpdating.set(false), 2000);
      }
    });
  }
  
  ngOnInit() {
    // Subscribe to charge point events
    this.websocketService.sendCommand(WsCommand.ListenChargePoints);
    
    // Load initial data
    this.loadStation();
  }
  
  private loadStation() {
    this.chargePointService.getStationDetail(this.stationId).subscribe({
      next: (data) => this.station.set(data),
      error: (err) => console.error('Failed to load station:', err)
    });
  }
}
```

## Debugging

### Enable Debug Mode

In `websocket.service.ts`, set:
```typescript
private debug = true; // Line 60
```

### Check Connection

```typescript
console.log('Connected?', this.websocketService.isConnected());
console.log('Connection state:', this.websocketService.connectionState());
```

### Monitor Updates

```typescript
effect(() => {
  const update = this.websocketService.chargePointUpdate();
  console.log('Charge point update:', update);
});
```

## Tips

1. **Only subscribe once**: Call `ListenChargePoints` only in `ngOnInit()`
2. **Filter updates**: Only react to updates for your specific station
3. **Provide feedback**: Show users when data is updating in real-time
4. **Handle errors**: Always include error handling when loading data
5. **Debounce if needed**: For rapid updates, debounce refresh calls

## Examples in Codebase

- **Stations List**: `/src/app/features/stations/stations-list/stations-list.component.ts`
- **Station Detail**: `/src/app/features/stations/station-detail/station-detail.component.ts`
- **WebSocket Service**: `/src/app/core/services/websocket.service.ts`

## See Also

- [Full Documentation](./CHARGE_POINT_UPDATES.md)
- [WebSocket Technical Guide](./WEBSOCKET_TECHNICAL_GUIDE.md)
- [WebSocket Description](./WEBSOCKET_DESCRIPTION.md)

---

**Version**: 1.0  
**Last Updated**: October 2025
