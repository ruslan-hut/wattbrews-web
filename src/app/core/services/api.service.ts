import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiError, PaginationInfo, FilterOptions } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    console.log('ApiService: Making GET request to:', fullUrl);
    console.log('ApiService: Request parameters:', params);
    console.log('ApiService: Full URL with params:', fullUrl);
    
    return this.http.get<ApiResponse<T>>(fullUrl, { params: httpParams })
      .pipe(
        map(response => {
          console.log('ApiService: Response received:', response);
          return this.handleResponse(response);
        }),
        catchError(error => {
          console.error('ApiService: Error in GET request:', error);
          return this.handleError(error);
        })
      );
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
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
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
   */
  getDirect<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const httpParams = this.buildHttpParams(params);
    const fullUrl = `${this.baseUrl}${endpoint}`;
    
    console.log('ApiService: Making direct GET request to:', fullUrl);
    console.log('ApiService: Request parameters:', params);
    
    return this.http.get<T>(fullUrl, { params: httpParams })
      .pipe(
        map(response => {
          console.log('ApiService: Direct response received:', response);
          return response;
        }),
        catchError(error => {
          console.error('ApiService: Error in direct GET request:', error);
          return this.handleError(error);
        })
      );
  }
}
