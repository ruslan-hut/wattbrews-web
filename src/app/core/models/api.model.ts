export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface FilterOptions {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
}

export interface StationFilter extends FilterOptions {
  status?: string[];
  connectorTypes?: string[];
  minPower?: number;
  maxPower?: number;
  isAvailable?: boolean;
  location?: LocationFilter;
  amenities?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface ApiSessionFilter extends FilterOptions {
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  stationId?: string;
  minCost?: number;
  maxCost?: number;
}
