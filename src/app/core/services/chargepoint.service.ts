import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ChargePoint, ChargePointFilters, ChargePointListResponse } from '../models/chargepoint.model';
import { StationDetail } from '../models/station-detail.model';
import { API_ENDPOINTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ChargePointService {
  private readonly apiService = inject(ApiService);
  
  // State management
  private readonly _chargePoints = signal<ChargePoint[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);

  // Public readonly signals
  readonly chargePoints = this._chargePoints.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // Computed values
  readonly onlineChargePoints = computed(() => 
    this._chargePoints().filter(cp => cp.is_online)
  );

  readonly availableChargePoints = computed(() => 
    this._chargePoints().filter(cp => cp.status === 'Available')
  );

  readonly enabledChargePoints = computed(() => 
    this._chargePoints().filter(cp => cp.is_enabled)
  );

  readonly totalConnectors = computed(() => 
    this._chargePoints().reduce((total, cp) => total + cp.connectors.length, 0)
  );

  readonly availableConnectors = computed(() => 
    this._chargePoints().reduce((total, cp) => 
      total + cp.connectors.filter(conn => conn.status === 'Available').length, 0
    )
  );

  /**
   * Load all charge points
   */
  loadChargePoints(filters?: ChargePointFilters): Observable<ChargePoint[]> {
    console.log('ChargePointService: Starting to load charge points');
    this._loading.set(true);
    this._error.set(null);

    const params = this.buildFilterParams(filters);
    console.log('ChargePointService: API call parameters:', params);

    // Use the new getArray method for direct array responses
    return this.apiService.getArray<ChargePoint>(API_ENDPOINTS.CHARGE_POINTS.LIST, params)
      .pipe(
        tap(chargePoints => {
          console.log('ChargePointService: Successfully loaded charge points:', chargePoints);
          this._chargePoints.set(chargePoints);
          this._lastUpdated.set(new Date());
          this._loading.set(false);
        }),
        catchError(error => {
          console.error('ChargePointService: Error loading charge points:', error);
          this._error.set(error.message || 'Failed to load charge points');
          this._loading.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get charge point by ID
   */
  getChargePoint(id: string): Observable<ChargePoint> {
    return this.apiService.get<ChargePoint>(`${API_ENDPOINTS.CHARGE_POINTS.DETAIL.replace(':id', id)}`);
  }

  /**
   * Get charge point status
   */
  getChargePointStatus(id: string): Observable<any> {
    return this.apiService.get<any>(`${API_ENDPOINTS.CHARGE_POINTS.STATUS.replace(':id', id)}`);
  }

  /**
   * Enable charge point
   */
  enableChargePoint(id: string): Observable<any> {
    return this.apiService.post<any>(`${API_ENDPOINTS.CHARGE_POINTS.ENABLE.replace(':id', id)}`)
      .pipe(
        tap(() => {
          // Update local state
          this.updateChargePointStatus(id, { is_enabled: true });
        })
      );
  }

  /**
   * Disable charge point
   */
  disableChargePoint(id: string): Observable<any> {
    return this.apiService.post<any>(`${API_ENDPOINTS.CHARGE_POINTS.DISABLE.replace(':id', id)}`)
      .pipe(
        tap(() => {
          // Update local state
          this.updateChargePointStatus(id, { is_enabled: false });
        })
      );
  }

  /**
   * Refresh charge points data
   */
  refreshChargePoints(filters?: ChargePointFilters): Observable<ChargePoint[]> {
    return this.loadChargePoints(filters);
  }

  /**
   * Get charge points by status
   */
  getChargePointsByStatus(status: string): ChargePoint[] {
    return this._chargePoints().filter(cp => cp.status === status);
  }

  /**
   * Get charge points by vendor
   */
  getChargePointsByVendor(vendor: string): ChargePoint[] {
    return this._chargePoints().filter(cp => cp.vendor === vendor);
  }

  /**
   * Get nearby charge points
   */
  getNearbyChargePoints(latitude: number, longitude: number, radius: number = 10): ChargePoint[] {
    return this._chargePoints().filter(cp => {
      const distance = this.calculateDistance(
        latitude, longitude,
        cp.location.latitude, cp.location.longitude
      );
      return distance <= radius;
    });
  }

  /**
   * Search charge points
   */
  searchChargePoints(query: string): ChargePoint[] {
    const lowerQuery = query.toLowerCase();
    return this._chargePoints().filter(cp => 
      cp.title.toLowerCase().includes(lowerQuery) ||
      cp.address.toLowerCase().includes(lowerQuery) ||
      cp.vendor.toLowerCase().includes(lowerQuery) ||
      cp.model.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this._chargePoints.set([]);
    this._error.set(null);
    this._lastUpdated.set(null);
  }

  /**
   * Build filter parameters for API call
   */
  private buildFilterParams(filters?: ChargePointFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters['status']) params['status'] = filters['status'];
    if (filters['vendor']) params['vendor'] = filters['vendor'];
    if (filters['is_online'] !== undefined) params['is_online'] = filters['is_online'];
    if (filters['is_enabled'] !== undefined) params['is_enabled'] = filters['is_enabled'];
    if (filters['search']) params['search'] = filters['search'];
    if (filters['location']) {
      params['latitude'] = filters['location']['latitude'];
      params['longitude'] = filters['location']['longitude'];
      if (filters['location']['radius']) params['radius'] = filters['location']['radius'];
    }

    return params;
  }

  /**
   * Update charge point status in local state
   */
  private updateChargePointStatus(id: string, updates: Partial<ChargePoint>): void {
    const currentChargePoints = this._chargePoints();
    const updatedChargePoints = currentChargePoints.map(cp => 
      cp.charge_point_id === id ? { ...cp, ...updates } : cp
    );
    this._chargePoints.set(updatedChargePoints);
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Get detailed station information by point ID
   */
  getStationDetail(pointId: string): Observable<StationDetail> {
    this._loading.set(true);
    this._error.set(null);

    const endpoint = API_ENDPOINTS.CHARGE_POINTS.POINT_DETAIL.replace(':id', pointId);
    
    console.log('ChargePointService: Loading station detail for point ID:', pointId);
    console.log('ChargePointService: Endpoint:', endpoint);
    
    return this.apiService.getDirect<StationDetail>(endpoint)
      .pipe(
        tap((station) => {
          console.log('ChargePointService: Station detail loaded successfully:', station);
          this._loading.set(false);
          this._lastUpdated.set(new Date());
        }),
        catchError(error => {
          console.error('ChargePointService: Error loading station detail:', error);
          this._error.set(error.message || 'Failed to load station details');
          this._loading.set(false);
          return throwError(() => error);
        })
      );
  }
}
