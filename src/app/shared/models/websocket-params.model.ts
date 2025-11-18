export interface WebSocketCommandParams {
  charge_point_id?: string;
  connector_id?: number;
  transaction_id?: number;
  [key: string]: string | number | undefined;
}

