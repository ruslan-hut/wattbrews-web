# WebSocket API Description

## Overview

The backend exposes a WebSocket endpoint at `/ws`. It is used for real‑time updates and control around user transactions, logs, and charge‑point events. The handshake itself does not enforce authentication; instead, token-based authentication happens on the first (and subsequent) messages sent over the socket.

Below is how it works end‑to‑end: authentication, commands, message formats, subscriptions, and what the server sends back.

## Endpoint and Handshake
- URL: `ws(s)://<host>:<port>/ws`
- Origin check: allowed unconditionally (`CheckOrigin` returns `true`). Use TLS at the HTTP server level if you need transport security.
- Proxy note: the server logs/annotates connection remote with `X-Forwarded-For` if present.
- No auth on the handshake. The client must authenticate via the first message payload.

## Authentication Flow
1. Client connects to `/ws`.
2. The client must send a JSON message containing a `token` (typically a previously issued auth token).
3. On the first valid message with `token`, the server:
   - Verifies the token via `core.AuthenticateByToken(token)`.
   - Converts the user to an `idTag` via `core.UserTag(user)`.
   - Overwrites `userRequest.Token` with the resolved `idTag` before passing it further into business logic.
4. If token is missing or invalid, the server replies with an error and ignores the request.

Notes:
- The server does not close the connection immediately on an invalid message, but it will respond with `status: "error"`.
- Once authenticated, the connection logger is augmented with user context.

## Client → Server Message Format
All client messages are JSON and conform to `entity.UserRequest`:

```json
{
  "token": "<user_access_token>",
  "charge_point_id": "<string>",
  "connector_id": 1,
  "transaction_id": 123,
  "command": "<CommandName>"
}
```

Fields:
- `token` (string, required for every message until authenticated): access token; after the first authenticated message, the server replaces this with user `idTag` when calling downstream logic.
- `charge_point_id` (string): optional, used by some commands.
- `connector_id` (int): optional, used by some commands.
- `transaction_id` (int): optional, used by some commands (e.g., stop, listen).
- `command` (enum): one of
  - `StartTransaction`
  - `StopTransaction`
  - `CheckStatus`
  - `ListenTransaction`
  - `StopListenTransaction`
  - `ListenChargePoints`
  - `ListenLog`
  - `PingConnection`

## Server → Client Message Format
All server messages are JSON and conform to `entity.WsResponse`:

```json
{
  "status": "<ResponseStatus>",
  "stage": "<ResponseStage>",
  "info": "<string>",
  "user_id": "<string>",
  "progress": 0,
  "power": 0,
  "power_rate": 0,
  "soc": 0,
  "price": 0,
  "minute": 0,
  "id": 0,
  "data": "<string>",
  "connector_id": 0,
  "connector_status": "<string>",
  "meter_value": { /* TransactionMeter */ }
}
```

Response status (`entity.ResponseStatus`):
- `success`
- `error`
- `waiting`
- `ping`
- `value` (per‑value stream updates like meter values)
- `event` (for log/charge‑point event fan‑out)

Response stage (`entity.ResponseStage`):
- `start`
- `stop`
- `info`
- `log-event`
- `charge-point-event`

Notes:
- Not all fields are present in every message; only relevant ones are filled (`omitempty`).
- For streaming meter updates, `meter_value` contains a `TransactionMeter` payload plus related summary fields (e.g., `power`, `power_rate`, `soc`, `price`, and `minute`).

## Commands and Their Behavior
After authentication, each inbound `UserRequest` is handed to `core.WsRequest`. Additionally, the WebSocket layer manages some long‑polling/stream behaviors:

- `StartTransaction`
  - Persists a transient user stage (`StageStart`) and starts a background wait loop up to ~90 seconds.
  - Every 2 seconds it checks for a transaction created after the saved time.
  - Emits periodic `waiting` updates with `stage: "start"`, `progress` percentage.
  - On detection: emits `success` with `stage: "start"`, `id: <transaction_id>`, `info: "transaction started"`.
  - On timeout: emits an `error` with `info: "timeout"`.

- `StopTransaction`
  - Persists `StageStop` with the provided `transaction_id` and waits up to ~90 seconds.
  - Every 3 seconds it checks if the transaction is finished.
  - Emits periodic `waiting` with `stage: "stop"`, `progress`.
  - On completion: emits `success` with `stage: "stop"`, `id: <transaction_id>`, `info: "transaction stopped"`.
  - On timeout: emits `error` with `info: "timeout"`.

- `CheckStatus`
  - Restores any previously saved user stage on reconnect (e.g., resume waiting for start/stop, or resume listening to a transaction’s meter values).

- `ListenTransaction`
  - Saves `StageListen` for the given `transaction_id`.
  - Begins a periodic stream (every 5 seconds) of new meter values via messages with `status: "value"`, `stage: "info"`, including `meter_value`, `power`, `power_rate`, `soc`, `price`, `minute`, `connector_id`, `connector_status`, and the `id` (transaction id).

- `StopListenTransaction`
  - Stops the above stream for the given `transaction_id`.

- `ListenLog`
  - Switches the client’s subscription to receive log messages (`stage: "log-event"`, `status: "event"`), broadcasted from the server side fan‑out loop. Messages additionally carry `data` (serialized log entry) and `info` (log text).

- `ListenChargePoints`
  - Switches the client’s subscription to receive charge‑point events (`stage: "charge-point-event"`, `status: "event"`), with `data` being the `charge_point_id` and `info` the text.

- `PingConnection`
  - Immediate response with `status: "success"` and `info: "pong <idTag>"`.

## Subscriptions and Broadcasts
- Internally, clients maintain a `subscription` setting. Possible values:
  - `broadcast` (not used by the provided routes but supported)
  - `log-event`
  - `charge-point-event`
- Default on connect: `charge-point-event`.
- A server loop (`listenForUpdates`) periodically reads log entries from a `StatusReader` and fans out:
  - Charge‑point events to all clients subscribed to `charge-point-event`.
  - Log events to all clients subscribed to `log-event`.

## Heartbeats and Keep‑alive
- The server ignores raw text `"ping"` messages from the client (no response needed) to avoid noise.
- A formal `PingConnection` command yields a `success`/`pong` response.
- The write loop will close on channel close or write errors; the read loop closes on unexpected close codes.

## Connection Lifecycle
- On connect, the client is added to a `Pool` and immediately sent a `ping` response: `{ "status": "ping", "stage": "info", "info": "new connection" }`.
- Two goroutines run per client:
  - `readPump` to read and process messages.
  - `writePump` to send outgoing messages from an internal channel.
- On close or error:
  - The client is unregistered from the pool, the socket is closed, and the internal `send` channel is closed to signal the writer.

## Example Client Messages
- Authenticate and start a transaction on connector 1 of a charge point:

```json
{
  "token": "eyJhbGciOi...",
  "charge_point_id": "CP-123",
  "connector_id": 1,
  "command": "StartTransaction"
}
```

- Stop an existing transaction:

```json
{
  "token": "eyJhbGciOi...",
  "transaction_id": 4567,
  "command": "StopTransaction"
}
```

- Subscribe to log events:

```json
{
  "token": "eyJhbGciOi...",
  "command": "ListenLog"
}
```

- Subscribe to charge‑point events (default but can be set explicitly):

```json
{
  "token": "eyJhbGciOi...",
  "command": "ListenChargePoints"
}
```

- Begin streaming meter values for a transaction:

```json
{
  "token": "eyJhbGciOi...",
  "transaction_id": 4567,
  "command": "ListenTransaction"
}
```

## Example Server Responses
- New connection (from pool):

```json
{ "status": "ping", "stage": "info", "info": "new connection" }
```

- While waiting for a transaction to start:

```json
{ "status": "waiting", "stage": "start", "progress": 42, "id": -1, "info": "waiting 38s; 42%" }
```

- Transaction started:

```json
{ "status": "success", "stage": "start", "id": 4567, "info": "transaction started: 4567" }
```

- Meter value update while listening:

```json
{
  "status": "value",
  "stage": "info",
  "id": 4567,
  "connector_id": 1,
  "connector_status": "Charging",
  "power": 7200,
  "power_rate": 11,
  "soc": 52,
  "price": 24,
  "minute": 17,
  "info": "Energy.Active.Import.Register",
  "meter_value": { /* TransactionMeter fields */ }
}
```

- Log event broadcast:

```json
{
  "status": "event",
  "stage": "log-event",
  "data": "{...serialized log entry...}",
  "info": "<human readable log text>"
}
```

- Charge‑point event broadcast:

```json
{
  "status": "event",
  "stage": "charge-point-event",
  "data": "CP-123",
  "info": "<event text>"
}
```

## Timeouts and Recovery
- Start/Stop flows time out after approximately 90 seconds with an `error` response.
- On reconnect, clients can send `CheckStatus` to resume any in‑progress waiting or listening.

## Implementation Pointers

- File: `internal/api/http/server.go` — WebSocket server, pool, client lifecycle, routing.
- Message types:
  - `entity/user_request.go` — client request schema and command names.
  - `entity/ws_response.go` — server response schema.
  - `entity/types.go` — status and stage enums used in responses.

---

**Version**: 1.0  
**Last Updated**: October 2025
