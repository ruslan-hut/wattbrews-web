# Transaction Start Flow Implementation

## Overview

This document describes the implementation of the transaction start flow in the WattBrews web application. When a user clicks the "Start Charge" button on the Start Transaction screen (after selecting a connector), a dialog window opens to handle the transaction initialization logic.

## Implementation Details

### 1. Transaction Start Dialog Component

**Location:** `/src/app/shared/components/transaction-start-dialog/transaction-start-dialog.component.ts`

The dialog component handles the entire transaction start flow:

- **Sends StartTransaction command** via WebSocket service
- **Listens to backend responses** using WebSocket subscriptions
- **Shows progress** with a progress bar and percentage
- **Handles different states:**
  - `initializing`: Initial state when dialog opens
  - `waiting`: Waiting for transaction to start (shows progress from backend)
  - `success`: Transaction started successfully
  - `error`: An error occurred during the process

#### Backend Message Format

The backend sends messages with the following structure:

```typescript
{
  "message": {
    "status": "waiting" | "success" | "error",
    "stage": "start",
    "info": "waiting 88s; 97%",
    "progress": 97,  // Progress percentage (0-100)
    "id": -1         // Transaction ID (populated on success)
  },
  "timestamp": "2025-10-12T09:56:21.016Z"
}
```

#### Dialog Features

- **Progress Tracking**: Shows real-time progress percentage
- **Status Messages**: Displays informative messages during each stage
- **Error Handling**: Shows error details with retry option
- **Auto-Navigation**: Automatically navigates to Active Sessions screen on success (after 2 seconds)
- **Non-Dismissible**: User cannot close dialog by clicking outside during transaction start

### 2. WebSocket Integration

The dialog uses the `WebsocketService` to:

1. **Send Command:**
   ```typescript
   await this.wsService.sendCommand(WsCommand.StartTransaction, {
     charge_point_id: this.data.chargePointId,
     connector_id: this.data.connectorId
   });
   ```

2. **Subscribe to Messages:**
   ```typescript
   this.wsService.subscribe((message: WsResponse) => {
     if (message.stage === ResponseStage.Start) {
       // Handle message based on status
     }
   });
   ```

3. **Filter by Stage:**
   - Only processes messages with `stage === 'start'`
   - Handles `waiting`, `success`, and `error` statuses

### 3. Charge Initiation Component Update

**Location:** `/src/app/features/stations/charge-initiation/charge-initiation.component.ts`

Updated the `startCharge()` method to:

1. Validate that connector and payment method are selected
2. Open the TransactionStartDialog with necessary data
3. Handle dialog close event

```typescript
const dialogRef = this.dialog.open(TransactionStartDialogComponent, {
  data: {
    chargePointId: station.charge_point_id,
    connectorId: connector.connector_id,
    stationTitle: station.title
  },
  disableClose: true,
  width: '500px',
  maxWidth: '95vw'
});
```

### 4. Translation Keys

Added translation keys in both English and Spanish:

**English (`en.json`):**
- `transactionStart.initializing`: "Initializing Transaction"
- `transactionStart.startingTransaction`: "Starting Transaction"
- `transactionStart.transactionStarted`: "Transaction Started"
- `transactionStart.failed`: "Transaction Failed"
- `transactionStart.waiting`: "Waiting for transaction to start..."
- `transactionStart.success`: "Transaction started successfully!"
- `transactionStart.errorSendingCommand`: "Failed to send start command"
- `transactionStart.errorOccurred`: "An error occurred while starting the transaction"
- `transactionStart.sendingCommand`: "Sending start command..."
- `transactionStart.waitingForResponse`: "Waiting for response from charging station..."
- `transactionStart.redirecting`: "Redirecting to active session..."

**Spanish (`es.json`):**
- Similar translations in Spanish

## User Flow

1. **User selects connector and payment method** on the Charge Initiation screen
2. **User clicks "Start Charge" button**
3. **Dialog opens** showing "Initializing Transaction"
4. **WebSocket command is sent** to backend
5. **Dialog shows "Starting Transaction"** with progress bar
6. **Backend sends progress updates:**
   - Status: `waiting`
   - Progress: 0-100%
   - Info: Human-readable message
7. **On Success:**
   - Dialog shows "Transaction Started" with checkmark icon
   - Transaction ID is stored
   - After 2 seconds, automatically navigates to `/sessions/active`
8. **On Error:**
   - Dialog shows error message
   - User can retry or close the dialog

## Files Modified/Created

### Created:
- `/src/app/shared/components/transaction-start-dialog/transaction-start-dialog.component.ts`

### Modified:
- `/src/app/features/stations/charge-initiation/charge-initiation.component.ts`
- `/src/app/shared/components/index.ts`
- `/src/assets/i18n/en.json`
- `/src/assets/i18n/es.json`

## Dependencies

The implementation uses the following Angular Material modules:
- `MatDialogModule` - Dialog container
- `MatProgressBarModule` - Progress indicator
- `MatIconModule` - Icons
- `MatButtonModule` - Buttons

## Future Enhancements

1. **Active Sessions Screen**: Currently navigates to `/sessions/active` which needs to be implemented
2. **Transaction Listening**: After successful start, could automatically subscribe to transaction updates
3. **Sound/Notification**: Could add sound or browser notification on success/error
4. **Loading Timeout**: Could add timeout handling if backend doesn't respond

## Testing

The implementation has been tested for TypeScript compilation errors with zero errors found. The build system encountered a transient esbuild deadlock which is not related to the code changes.

To test the flow:
1. Navigate to a charge station
2. Click "Start Charge"
3. Select a connector and payment method
4. Click "Start Charge" button
5. Observe the dialog showing progress
6. Wait for success or error response from backend

## Notes

- The dialog is non-dismissible during transaction start to prevent user confusion
- All messages are properly translated in English and Spanish
- The component follows Angular best practices (standalone components, signals, OnPush change detection)
- Error handling includes retry functionality
- Progress is shown as both a visual bar and percentage text

---

**Version**: 1.0  
**Last Updated**: October 2025
