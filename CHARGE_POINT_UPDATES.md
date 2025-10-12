# Charge Point Updates Implementation

## Overview

The WebSocket service now provides a **signal-based mechanism** for charge point updates, allowing components to reactively respond to real-time station data changes. This implementation uses Angular signals alongside the existing RxJS subscription system, providing maximum flexibility.

## Architecture

### WebSocket Service (`websocket.service.ts`)

The service now includes:

1. **Signal for Charge Point Updates**
   ```typescript
   readonly chargePointUpdate: Signal<{
     chargePointId: string;
     connectorId?: number;
     timestamp: Date;
   } | null>
   ```

2. **Automatic Detection**
   - When a WebSocket message arrives with `stage: 'charge-point-event'` and a `data` field containing the station ID, the signal is automatically updated
   - The `connector_id` field is also captured if present

3. **Helper Method**
   ```typescript
   clearChargePointUpdate(): void
   ```
   - Allows components to manually clear the update signal after consuming it

### Message Format

The WebSocket service listens for messages with the following structure:

```typescript
{
  status: 'event',
  stage: 'charge-point-event',
  info: 'unregistered: total connections 9',
  data: 'Office1',           // Station ID
  connector_id?: 2           // Optional connector ID
}
```

## Component Integration

### Stations List Component

**Features:**
- Automatically reloads all stations when any charge point is updated
- Highlights the updated station for 3 seconds
- Provides visual feedback for real-time updates

**Implementation:**
```typescript
constructor() {
  // Set up effect to react to charge point updates
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update && update.chargePointId) {
      // Reload stations list to get fresh data
      this.loadStations();
      
      // Highlight the updated station temporarily
      this.updatedStationId.set(update.chargePointId);
      this.realtimeActive.set(true);
      
      // Clear highlight after 3 seconds
      setTimeout(() => {
        this.updatedStationId.set(null);
        this.realtimeActive.set(false);
      }, 3000);
    }
  });
}
```

**Initialization:**
```typescript
private initializeWebSocketSubscriptions(): void {
  // Subscribe to charge point events
  this.websocketService.sendCommand(WsCommand.ListenChargePoints);
  this.wsSubscriptionActive = true;
}
```

**Template Usage:**
```typescript
// Check if a station is currently highlighted
isStationUpdated(stationId: string): boolean {
  return this.updatedStationId() === stationId;
}
```

### Station Detail Component

**Features:**
- Only updates when the displayed station receives an update
- Highlights specific connectors when they change
- Dual approach: both signal-based effect AND RxJS subscription

**Implementation:**
```typescript
constructor() {
  // Set up effect to react to charge point updates for this specific station
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    const currentStation = this.stationDetail();
    
    if (update && currentStation && update.chargePointId === currentStation.charge_point_id) {
      // Refresh station detail
      this.loadStationDetail();
      
      // Highlight updated connector if connector_id is present
      if (update.connectorId) {
        this.highlightConnector(update.connectorId);
      }
      
      // Set real-time indicator
      this.realtimeActive.set(true);
      setTimeout(() => this.realtimeActive.set(false), 2000);
    }
  });
}
```

**Existing RxJS Subscription (still active):**
```typescript
private initializeWebSocketSubscriptions(): void {
  this.websocketService.sendCommand(WsCommand.ListenChargePoints);
  
  // Listen for charge-point events
  this.websocketSubscription = this.websocketService.subscribeToStage(
    ResponseStage.ChargePointEvent,
    (message) => {
      this.handleChargePointEvent(message);
    }
  );
}
```

## Usage Patterns

### Pattern 1: Signal-Based with Effect (Recommended)

Best for: Components that need reactive updates tied to their lifecycle.

```typescript
constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update) {
      // React to update
      this.handleUpdate(update);
    }
  });
}
```

**Advantages:**
- Automatic cleanup when component is destroyed
- Integrates with Angular's reactive system
- Can be combined with other signals using `computed()`

### Pattern 2: RxJS Subscription

Best for: Complex filtering, debouncing, or Observable composition.

```typescript
ngOnInit() {
  this.subscription = this.websocketService.subscribeToStage(
    ResponseStage.ChargePointEvent,
    (message) => {
      // Handle message
    }
  );
}

ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

**Advantages:**
- More control over subscription lifecycle
- RxJS operators available for complex transformations
- Can be combined with other Observables

### Pattern 3: Hybrid (Both)

The station-detail component uses both approaches:
- **Signal effect** for automatic reactive updates
- **RxJS subscription** for detailed message handling

This provides maximum flexibility and allows gradual migration to signal-based patterns.

## Best Practices

### 1. Initialize WebSocket Subscription

Always send the `ListenChargePoints` command after authentication:

```typescript
this.websocketService.sendCommand(WsCommand.ListenChargePoints);
```

### 2. Filter Updates in Effects

For components displaying specific stations, filter updates:

```typescript
effect(() => {
  const update = this.websocketService.chargePointUpdate();
  const myStationId = this.currentStationId();
  
  if (update && update.chargePointId === myStationId) {
    // Update only if relevant
    this.refresh();
  }
});
```

### 3. Visual Feedback

Provide users with visual feedback when data updates in real-time:

```typescript
// Set indicator
this.realtimeActive.set(true);

// Clear after delay
setTimeout(() => this.realtimeActive.set(false), 2000);
```

### 4. Cleanup

The signal-based approach with `effect()` automatically cleans up when the component is destroyed. For RxJS subscriptions, always unsubscribe:

```typescript
ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

## Integration with ChargePointService

The components reload data from the `ChargePointService` when updates occur:

```typescript
// Stations list
this.chargePointService.loadChargePoints().subscribe();

// Station detail
this.chargePointService.getStationDetail(id).subscribe();
```

This ensures:
- Fresh data from the API
- Consistent state management
- Proper error handling through the service

## Performance Considerations

### Debouncing

If you receive many rapid updates, consider debouncing:

```typescript
private updateDebounceTimeout: any;

effect(() => {
  const update = this.websocketService.chargePointUpdate();
  
  if (update) {
    // Clear existing timeout
    if (this.updateDebounceTimeout) {
      clearTimeout(this.updateDebounceTimeout);
    }
    
    // Debounce updates
    this.updateDebounceTimeout = setTimeout(() => {
      this.refresh();
    }, 500);
  }
});
```

### Selective Updates

For station-detail component, only the relevant station updates trigger a refresh:

```typescript
if (update && currentStation && update.chargePointId === currentStation.charge_point_id) {
  // Update only this station
}
```

This prevents unnecessary API calls and re-renders.

## Testing

### Manual Testing

1. **Start WebSocket Connection**: Ensure user is authenticated
2. **Subscribe to Updates**: Send `ListenChargePoints` command
3. **Trigger Update**: Cause a charge point event (e.g., start/stop charging)
4. **Verify Signal Update**: Check that `chargePointUpdate` signal changes
5. **Verify Component Update**: Confirm components refresh and highlight

### Message Simulation

You can test with simulated messages:

```typescript
// In development/testing
const testMessage: WsResponse = {
  status: ResponseStatus.Event,
  stage: ResponseStage.ChargePointEvent,
  data: 'Office1',
  connector_id: 2,
  info: 'Connector status changed'
};

// Manually trigger the message handler (private, so for testing only)
```

## Migration Guide

### From Pure RxJS to Signal-Based

**Before:**
```typescript
ngOnInit() {
  this.subscription = this.websocketService.subscribeToStage(
    ResponseStage.ChargePointEvent,
    (message) => {
      if (message.data === this.stationId) {
        this.loadStation();
      }
    }
  );
}

ngOnDestroy() {
  this.subscription?.unsubscribe();
}
```

**After:**
```typescript
constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    if (update && update.chargePointId === this.stationId) {
      this.loadStation();
    }
  });
}

// No ngOnDestroy cleanup needed for effect!
```

## Troubleshooting

### Updates Not Received

1. **Check WebSocket Connection**: `websocketService.isConnected()`
2. **Verify Subscription**: Ensure `ListenChargePoints` was sent
3. **Check Authentication**: Token must be valid
4. **Debug Mode**: Enable debug in `websocket.service.ts` (line 60)

### Multiple Updates

If components receive duplicate updates:
- Implement debouncing (see Performance Considerations)
- Check that `ListenChargePoints` is only sent once
- Verify no duplicate subscriptions

### Signal Not Updating

If the signal doesn't change:
- Verify the message format matches expected structure
- Check that `stage === 'charge-point-event'`
- Ensure `data` field contains the station ID
- Enable debug mode to see incoming messages

## Future Enhancements

### Possible Improvements

1. **Transaction Updates Signal**: Similar pattern for transaction events
2. **Error State Signal**: Dedicated signal for WebSocket errors
3. **Connection Quality Signal**: Track latency and message frequency
4. **Typed Update Events**: More specific TypeScript types for different event types
5. **Update History**: Keep a rolling buffer of recent updates for debugging

## Summary

The new signal-based charge point update system provides:
- ✅ Reactive, automatic updates
- ✅ Type-safe implementation
- ✅ Automatic cleanup
- ✅ Compatible with existing RxJS patterns
- ✅ Flexible for different component needs
- ✅ Visual feedback for real-time updates

Both the stations-list and station-detail components now automatically stay in sync with the backend via WebSocket messages, providing users with real-time visibility into station status changes.

---

**Version**: 1.0  
**Last Updated**: October 2025
