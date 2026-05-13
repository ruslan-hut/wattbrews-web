import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TranslationRequest {
  keys: string[];
  targetLanguage: string;
  model: string;
  style: string;
}

export interface TranslationResponse {
  translations: any;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationProxyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/translate';

  translateKeys(request: TranslationRequest): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(this.apiUrl, request);
  }
}

