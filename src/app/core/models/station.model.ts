export interface ChargingStation {
  id: string;
  name: string;
  address: StationAddress;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: StationStatus;
  connectors: Connector[];
  tariffs: Tariff[];
  amenities: string[];
  operatingHours: OperatingHours;
  contactInfo: ContactInfo;
  images: string[];
  rating: number;
  totalReviews: number;
  isFavourite: boolean;
  distance?: number; // Distance from user location in km
}

export interface Connector {
  id: string;
  type: ConnectorType;
  power: number; // kW
  status: ConnectorStatus;
  currentSession?: string; // Session ID if in use
  lastUsed?: Date;
}

export interface Tariff {
  id: string;
  name: string;
  pricePerKwh: number;
  currency: string;
  timeBasedPricing?: TimeBasedPricing[];
  membershipRequired: boolean;
  isActive: boolean;
}

export interface TimeBasedPricing {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  pricePerKwh: number;
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface StationAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export enum StationStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OUT_OF_ORDER = 'out_of_order',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

export enum ConnectorType {
  TYPE_1 = 'type_1',
  TYPE_2 = 'type_2',
  CCS = 'ccs',
  CHADEMO = 'chademo',
  TESLA = 'tesla'
}

export enum ConnectorStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  OUT_OF_ORDER = 'out_of_order',
  RESERVED = 'reserved'
}
