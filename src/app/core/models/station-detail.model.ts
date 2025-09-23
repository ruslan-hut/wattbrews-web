export interface StationLocation {
  latitude: number;
  longitude: number;
}

export interface StationConnector {
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

export interface StationDetail {
  charge_point_id: string;
  is_enabled: boolean;
  title: string;
  model: string;
  serial_number: string;
  vendor: string;
  firmware_version: string;
  status: string;
  error_code: string;
  info: string;
  last_seen: string;
  event_time: string;
  is_online: boolean;
  status_time: string;
  address: string;
  access_type: string;
  access_level: number;
  location: StationLocation;
  connectors: StationConnector[];
}
