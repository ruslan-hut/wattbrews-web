export interface ChargingSession {
  id: string;
  userId: string;
  stationId: string;
  connectorId: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  energyDelivered: number; // kWh
  cost: number;
  currency: string;
  paymentMethodId: string;
  paymentStatus: PaymentStatus;
  location: {
    stationName: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  connector: {
    type: string;
    power: number; // kW
  };
  realTimeData?: RealTimeSessionData;
  createdAt: Date;
  updatedAt: Date;
}

export interface RealTimeSessionData {
  currentPower: number; // kW
  energyDelivered: number; // kWh
  estimatedTimeRemaining?: number; // minutes
  currentCost: number;
  chargingSpeed: number; // kW
  batteryLevel?: number; // percentage
  temperature?: number; // Celsius
  lastUpdated: Date;
}

export interface SessionFilterOptions {
  status?: SessionStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  stationId?: string;
  minCost?: number;
  maxCost?: number;
  minEnergy?: number;
  maxEnergy?: number;
}

export interface SessionStats {
  totalSessions: number;
  totalEnergyDelivered: number; // kWh
  totalCost: number;
  averageSessionDuration: number; // minutes
  averageEnergyPerSession: number; // kWh
  averageCostPerSession: number;
  mostUsedStation?: {
    id: string;
    name: string;
    sessions: number;
  };
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  sessions: number;
  energyDelivered: number;
  cost: number;
  averageDuration: number;
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  PENDING = 'pending'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
