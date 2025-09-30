import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserInfo, UserInfoFilters, PaymentPlan, UserTag, UserPaymentMethod } from '../models/user-info.model';
import { API_ENDPOINTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  private readonly apiService = inject(ApiService);
  
  // State management
  private readonly _userInfo = signal<UserInfo | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastUpdated = signal<Date | null>(null);

  // Public readonly signals
  readonly userInfo = this._userInfo.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastUpdated = this._lastUpdated.asReadonly();

  // Computed values
  readonly activePaymentPlans = computed(() => 
    this._userInfo()?.payment_plans.filter(plan => plan.is_active) || []
  );

  readonly defaultPaymentPlan = computed(() => 
    this._userInfo()?.payment_plans.find(plan => plan.is_default) || null
  );

  readonly enabledUserTags = computed(() => 
    this._userInfo()?.user_tags.filter(tag => tag.is_enabled) || []
  );

  readonly defaultPaymentMethod = computed(() => 
    this._userInfo()?.payment_methods.find(method => method.is_default) || null
  );

  readonly activePaymentMethods = computed(() => 
    this._userInfo()?.payment_methods || []
  );

  /**
   * Load current user info using special endpoint
   */
  loadCurrentUserInfo(filters?: UserInfoFilters): Observable<UserInfo> {
    this._loading.set(true);
    this._error.set(null);

    const params = this.buildFilterParams(filters);
    const endpoint = `${API_ENDPOINTS.USERS.INFO}/0000`; // '0000' is special code for current user
    
    return this.apiService.getDirect<UserInfo>(endpoint, params)
      .pipe(
        tap(userInfo => {
          this._userInfo.set(userInfo);
          this._lastUpdated.set(new Date());
          this._loading.set(false);
        }),
        catchError(error => {
          this._error.set(error.message || 'Failed to load user info');
          this._loading.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Load user info by user ID (for admin purposes)
   */
  loadUserInfo(userId: string, filters?: UserInfoFilters): Observable<UserInfo> {
    this._loading.set(true);
    this._error.set(null);

    const params = this.buildFilterParams(filters);
    const endpoint = `${API_ENDPOINTS.USERS.INFO}/${userId}`;

    return this.apiService.get<UserInfo>(endpoint, params)
      .pipe(
        tap(userInfo => {
          this._userInfo.set(userInfo);
          this._lastUpdated.set(new Date());
          this._loading.set(false);
        }),
        catchError(error => {
          this._error.set(error.message || 'Failed to load user info');
          this._loading.set(false);
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh current user info
   */
  refreshCurrentUserInfo(filters?: UserInfoFilters): Observable<UserInfo> {
    return this.loadCurrentUserInfo(filters);
  }

  /**
   * Refresh user info by ID
   */
  refreshUserInfo(userId: string, filters?: UserInfoFilters): Observable<UserInfo> {
    return this.loadUserInfo(userId, filters);
  }

  /**
   * Get payment plans
   */
  getPaymentPlans(): PaymentPlan[] {
    return this._userInfo()?.payment_plans || [];
  }

  /**
   * Get user tags
   */
  getUserTags(): UserTag[] {
    return this._userInfo()?.user_tags || [];
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(): UserPaymentMethod[] {
    return this._userInfo()?.payment_methods || [];
  }

  /**
   * Get user role
   */
  getUserRole(): string {
    return this._userInfo()?.role || 'user';
  }

  /**
   * Get access level
   */
  getAccessLevel(): number {
    return this._userInfo()?.access_level || 0;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  /**
   * Get user registration date
   */
  getRegistrationDate(): Date | null {
    const dateStr = this._userInfo()?.date_registered;
    return dateStr ? new Date(dateStr) : null;
  }

  /**
   * Get last seen date
   */
  getLastSeenDate(): Date | null {
    const dateStr = this._userInfo()?.last_seen;
    return dateStr ? new Date(dateStr) : null;
  }

  /**
   * Get card brand name
   */
  getCardBrandName(cardBrand: string): string {
    const brandMap: { [key: string]: string } = {
      '1': 'Visa',
      '2': 'Mastercard',
      '3': 'American Express',
      '4': 'Discover',
      '5': 'Diners Club',
      '6': 'JCB'
    };
    return brandMap[cardBrand] || 'Unknown';
  }

  /**
   * Get country name from country code
   */
  getCountryName(countryCode: string): string {
    const countryMap: { [key: string]: string } = {
      '724': 'Spain',
      '804': 'Ukraine',
      '840': 'United States',
      '826': 'United Kingdom',
      '276': 'Germany',
      '250': 'France'
    };
    return countryMap[countryCode] || `Country ${countryCode}`;
  }

  /**
   * Format expiry date
   */
  formatExpiryDate(expiryDate: string): string {
    if (expiryDate.length === 4) {
      const year = expiryDate.substring(0, 2);
      const month = expiryDate.substring(2, 4);
      return `${month}/${year}`;
    }
    return expiryDate;
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
    this._userInfo.set(null);
    this._error.set(null);
    this._lastUpdated.set(null);
  }

  /**
   * Build filter parameters for API call
   */
  private buildFilterParams(filters?: UserInfoFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters['include_payment_methods'] !== undefined) {
      params['include_payment_methods'] = filters['include_payment_methods'];
    }
    if (filters['include_user_tags'] !== undefined) {
      params['include_user_tags'] = filters['include_user_tags'];
    }
    if (filters['include_payment_plans'] !== undefined) {
      params['include_payment_plans'] = filters['include_payment_plans'];
    }

    return params;
  }
}
