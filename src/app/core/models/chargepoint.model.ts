export interface ChargePointLocation {
  latitude: number;
  longitude: number;
}

export interface ChargePointConnector {
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

export interface ChargePoint {
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
  location: ChargePointLocation;
  connectors: ChargePointConnector[];
}

export interface ChargePointFilters {
  status?: string;
  vendor?: string;
  is_online?: boolean;
  is_enabled?: boolean;
  search?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
  };
}

export interface ChargePointListResponse {
  data: ChargePoint[];
  total: number;
  page: number;
  limit: number;
}
