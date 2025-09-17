export interface TransactionConnector {
  connector_id: number;
  connector_id_name: string;
  charge_point_id: string;
  type: string;
  status: string;
  status_time: string;
  state: string;
  info: string;
  vendor_id: string;
  error_code: string;
  power: number;
  current_transaction_id: number;
}

export interface MeterValueDetail {
  transaction_id: number;
  value: number;
  power_rate: number;
  battery_level: number;
  consumed_energy: number;
  price: number;
  time: string;
  timestamp: number;
  minute: number;
  unit: string;
  measurand: string;
  connector_id: number;
  connector_status: string;
}

export interface TransactionDetail {
  transaction_id: number;
  connector_id: number;
  connector: TransactionConnector;
  charge_point_id: string;
  charge_point_title: string;
  charge_point_address: string;
  time_started: string;
  meter_start: number;
  duration: number;
  consumed: number;
  power_rate: number;
  price: number;
  status: string;
  is_charging: boolean;
  can_stop: boolean;
  meter_values: MeterValueDetail[];
}
