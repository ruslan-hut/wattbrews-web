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

