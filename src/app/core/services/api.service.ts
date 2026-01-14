import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retryWhen, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiError, PaginationInfo, FilterOptions } from '../models/api.model';
import { AppError, AppErrorFactory } from '../models/error.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 second

  /**
   * Generic GET request with retry logic
   */
  get<T>(endpoint: string, params?: Record<string, any>, retryCount: number = this.MAX_RETRIES): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<ApiResponse<T>>(fullUrl, { params: httpParams })
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, index) => {
              const retryAttempt = index + 1;
              // Only retry on network errors or 5xx server errors
              if (retryAttempt <= retryCount && this.shouldRetry(error)) {
                return timer(this.RETRY_DELAY_MS * retryAttempt);
              }
              return throwError(() => error);
            })
          )
        ),
        map(response => {
          return this.handleResponse(response);
        }),
        catchError(error => {
          return this.handleError(error);
        })
      );
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: HttpErrorResponse | Error): boolean {
    if (error instanceof HttpErrorResponse) {
      // Retry on network errors (status 0) or 5xx server errors
      return error.status === 0 || (error.status >= 500 && error.status < 600);
    }
    // Retry on generic errors (likely network issues)
    return true;
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, data?: any, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { params: httpParams })
      .pipe(
        map(response => this.handleResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, data?: any, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { params: httpParams })
      .pipe(
        map(response => this.handleResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, data?: any, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { params: httpParams })
      .pipe(
        map(response => this.handleResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        map(response => this.handleResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Upload file
   */
  uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        map(response => this.handleResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Download file
   */
  downloadFile(endpoint: string, params?: Record<string, any>): Observable<Blob> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Build HTTP parameters from object
   */
  private buildHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => {
              httpParams = httpParams.append(key, item.toString());
            });
          } else if (value instanceof Date) {
            httpParams = httpParams.set(key, value.toISOString());
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }
    
    return httpParams;
  }

  /**
   * Handle API response
   */
  private handleResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }
    return response.data as T;
  }

  /**
   * Handle HTTP errors and convert to AppError format
   */
  private handleError(error: HttpErrorResponse | Error): Observable<never> {
    let appError: AppError;

    if (error instanceof HttpErrorResponse) {
      appError = AppErrorFactory.fromHttpError(error);
    } else {
      appError = AppErrorFactory.fromUnknown(error);
    }

    return throwError(() => appError);
  }

  /**
   * Build query string from filter options
   */
  buildQueryString(options: FilterOptions): string {
    const params = new URLSearchParams();
    
    if (options.search) params.set('search', options.search);
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.sortBy) params.set('sortBy', options.sortBy);
    if (options.sortOrder) params.set('sortOrder', options.sortOrder);
    
    if (options.filters) {
      Object.keys(options.filters).forEach(key => {
        const value = options.filters![key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(key, item.toString()));
          } else {
            params.set(key, value.toString());
          }
        }
      });
    }
    
    return params.toString();
  }

  /**
   * Get paginated results
   */
  getPaginated<T>(
    endpoint: string, 
    options: FilterOptions = {}
  ): Observable<{ data: T[]; pagination: PaginationInfo }> {
    const queryString = this.buildQueryString(options);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.get<{ data: T[]; pagination: PaginationInfo }>(url);
  }

  /**
   * Get direct array response (for endpoints that return arrays directly)
   * @deprecated Consider using get<T[]>() with proper API response wrapper
   */
  getArray<T>(endpoint: string, params?: Record<string, any>): Observable<T[]> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<T[]>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Get direct object response (for endpoints that return objects directly)
   * @deprecated Consider using get<T>() with proper API response wrapper
   */
  getDirect<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<T>(fullUrl, { params: httpParams })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(error => {
          return this.handleError(error);
        })
      );
  }
}
