# Signal Lifecycle and Effect Best Practices

## Overview

This document outlines best practices for using Angular signals and `effect()` in this codebase, specifically to prevent infinite loops and ensure proper signal lifecycle management.

## Signal Types

### Transient Event Signals
Signals that represent discrete events and should be cleared after consumption:

- **Example**: `websocketService.chargePointUpdate()`
- **Characteristics**: 
  - Set to a non-null value when an event occurs
  - Should be cleared immediately after processing
  - Used to trigger reactive updates in components
  - Remains non-null until explicitly cleared

### Persistent State Signals
Signals that represent ongoing state and should not be cleared:

- **Examples**: `chargePointService.loading()`, `authService.isAuthenticated()`
- **Characteristics**:
  - Values change to reflect current state
  - Naturally transitions between values
  - Don't need explicit clearing
  - Used for reactive UI updates

## Effect Patterns

### Safe Pattern: Transient Event Signal Consumption

When using `effect()` to consume transient event signals, always follow this pattern:

```typescript
private isProcessingUpdate = false;

constructor() {
  effect(() => {
    const update = this.websocketService.chargePointUpdate();
    
    // Guard: Only process if we have an update and we're not already processing
    if (update && update.chargePointId && !this.isProcessingUpdate) {
      this.isProcessingUpdate = true;
      
      // CRITICAL: Clear the update signal immediately to prevent re-triggering
      this.websocketService.clearChargePointUpdate();
      
      // Guard: Only reload if not already loading to prevent infinite loops
      if (!this.loading()) {
        this.loadData();
      }
      
      // Reset processing flag after timeout or completion
      setTimeout(() => {
        this.isProcessingUpdate = false;
      }, 3000);
    } else if (!update) {
      // If no update, allow processing again
      this.isProcessingUpdate = false;
    }
  });
}
```

**Key Requirements:**
1. ✅ Processing guard (`isProcessingUpdate`) to prevent concurrent execution
2. ✅ Immediate signal clearing (`clearChargePointUpdate()`) after reading
3. ✅ Loading guard before triggering async operations
4. ✅ Proper cleanup/reset of processing state

### Safe Pattern: Input Signal Consumption

When using `effect()` to react to input signal changes:

```typescript
constructor() {
  effect(() => {
    const values = this.meterValues(); // Input signal
    if (values) {
      this.processData(); // Synchronous operation only
    }
  });
}
```

**Key Requirements:**
- ✅ No async operations that could cause loops
- ✅ No external signal dependencies that require clearing
- ✅ Simple reactive processing

### Safe Pattern: UI State Reactions

When using `effect()` for UI-only reactions:

```typescript
constructor() {
  effect(() => {
    if (this.autoScroll() && this.messages().length > 0) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  });
}
```

**Key Requirements:**
- ✅ No API calls or data loading
- ✅ Side effects are UI-only (scrolling, DOM updates)
- ✅ Debounced with setTimeout if needed

## RxJS Subscription Patterns

### Safe Pattern: WebSocket Event Handlers

When handling WebSocket events via RxJS subscriptions, add loading guards:

```typescript
private handleChargePointEvent(message: WsResponse): void {
  const chargePointId = message.data;
  
  if (!chargePointId) {
    return;
  }
  
  // Guard: Only refresh if not already loading
  if (!this.chargePointService.loading()) {
    this.chargePointService.refreshChargePoints().subscribe({
      next: () => {
        // Data refreshed successfully
      },
      error: (error) => {
        console.error('[Component] Failed to refresh:', error);
      }
    });
  }
}
```

**Key Requirements:**
1. ✅ Check loading state before triggering API calls
2. ✅ Proper error handling
3. ✅ No recursive calls back to the handler

## Common Pitfalls

### ❌ Problematic Pattern: Signal Not Cleared

```typescript
effect(() => {
  const update = this.websocketService.chargePointUpdate();
  if (update) {
    this.loadData(); // Signal never cleared - causes infinite loop!
  }
});
```

**Problem**: Signal remains non-null, causing effect to re-run continuously.

**Solution**: Always clear transient event signals immediately after reading.

### ❌ Problematic Pattern: Missing Loading Guard

```typescript
effect(() => {
  const update = this.websocketService.chargePointUpdate();
  if (update) {
    this.websocketService.clearChargePointUpdate();
    this.loadData(); // Could trigger while already loading!
  }
});
```

**Problem**: Multiple rapid updates could trigger concurrent API calls.

**Solution**: Check loading state before triggering async operations.

### ❌ Problematic Pattern: No Processing Guard

```typescript
effect(() => {
  const update = this.websocketService.chargePointUpdate();
  if (update) {
    this.websocketService.clearChargePointUpdate();
    this.loadData(); // Could process same update multiple times!
  }
});
```

**Problem**: If effect runs multiple times before clear completes, same update processed multiple times.

**Solution**: Use `isProcessingUpdate` flag to prevent concurrent processing.

## WebSocket Service Signals

### chargePointUpdate Signal

- **Type**: Transient event signal
- **Lifecycle**: Set when `ChargePointEvent` message received, cleared manually by consumers
- **Clear Method**: `websocketService.clearChargePointUpdate()`
- **Usage**: Components should clear immediately after processing

```typescript
// In WebSocketService
private readonly _chargePointUpdate = signal<{ 
  chargePointId: string; 
  connectorId?: number; 
  timestamp: Date 
} | null>(null);

// Clear method provided for consumers
clearChargePointUpdate(): void {
  this._chargePointUpdate.set(null);
}
```

### Other Signals

- `connectionState` - Persistent state signal (auto-transitions)
- `lastMessage` - State signal (overwritten on new messages)
- `lastError` - State signal (set to null on success)
- `messageCount` - Persistent counter (only increments)
- `lastPingTime` - State signal (updated periodically)

## Checklist for New Effects

When creating a new `effect()`, verify:

- [ ] **Signal Type**: Is it transient (needs clearing) or persistent (auto-transitions)?
- [ ] **Signal Clearing**: If transient, is it cleared immediately after reading?
- [ ] **Processing Guard**: Is there a flag to prevent concurrent execution?
- [ ] **Loading Guard**: Before async operations, do we check loading state?
- [ ] **Cleanup**: Is processing state properly reset?
- [ ] **No Recursion**: Will the effect trigger operations that cause it to re-run?
- [ ] **Error Handling**: Are errors handled without breaking the effect?

## Testing Guidelines

When testing components with effects:

1. **Simulate rapid updates**: Test what happens when multiple events arrive quickly
2. **Test loading state**: Verify guards prevent calls while loading
3. **Test signal clearing**: Ensure effects don't re-trigger after clearing
4. **Test concurrent execution**: Verify processing guards work correctly

## Examples in Codebase

### ✅ Good Examples

- `stations-list.component.ts` - Properly clears `chargePointUpdate` signal
- `station-detail.component.ts` - Has all required guards
- `energy-chart.component.ts` - Safe input signal consumption
- `websocket-test.component.ts` - UI-only effect

### ⚠️ Improved Examples

- `dashboard.component.ts` - Now includes loading guards for WebSocket handlers
- `active-sessions.component.ts` - Now includes loading guards for WebSocket handlers

## Migration Guide

If you encounter an infinite loop caused by effects:

1. **Identify the signal**: Determine if it's transient or persistent
2. **Add signal clearing**: If transient, clear immediately after reading
3. **Add processing guard**: Use `isProcessingUpdate` flag
4. **Add loading guard**: Check loading state before API calls
5. **Test thoroughly**: Verify the fix prevents the loop

## References

- Angular Signals Documentation: https://angular.dev/guide/signals
- Angular Effect API: https://angular.dev/api/core/effect
- Issue: Infinite loop on stations page when translations load
- Fix: Added signal clearing, processing guards, and loading guards

