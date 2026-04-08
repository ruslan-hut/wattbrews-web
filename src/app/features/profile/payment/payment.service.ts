import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/app.constants';
import { AppError, AppErrorFactory } from '../../../core/models/error.model';
import {
  InSiteOrderResponse,
  InSiteTokenResult,
  PaymentOrderRequest,
  SavePaymentMethodRequest,
  SavePaymentMethodResponse,
} from '../../../core/models/payment.model';

/**
 * PaymentService owns the two pieces of the "add card" flow that live
 * outside the Angular component tree:
 *
 *  1. HTTP calls to the EVSys backend (`/payment/order`, `/payment/save`).
 *     The backend returns raw JSON (not the wrapped `{success,data}` shape
 *     `ApiService.post` assumes), so we use HttpClient directly — this
 *     mirrors how `UserInfoService` uses `apiService.getDirect`.
 *
 *  2. Dynamic loading of the Redsys inSite JS SDK. The SDK is only needed
 *     on the add-card dialog, so we lazy-load it via an idempotent script
 *     injection and a cached Promise.
 *
 * The component hosting the dialog owns the state machine and UI; this
 * service stays thin and side-effect-free beyond the HTTP + script load.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly insiteScriptUrl = environment.redsys?.insiteScriptUrl ?? '';

  private redsysScriptPromise?: Promise<void>;

  /**
   * Creates a Redsys inSite order server-side. The backend signs the
   * merchant parameters and returns the `Ds_*` triplet the browser must
   * pass to the inSite JS SDK together with the stored order number.
   */
  createInSiteOrder(
    req: Omit<PaymentOrderRequest, 'mode'>,
  ): Observable<InSiteOrderResponse> {
    const body: PaymentOrderRequest = { ...req, mode: 'insite' };
    return this.http
      .post<InSiteOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PAYMENT.ORDER}`, body)
      .pipe(catchError((err) => this.toAppError(err)));
  }

  /**
   * Persists a tokenized card and asks the backend to echo back the
   * updated methods list (`?include_list=1`) so the caller can refresh
   * the UI in a single round-trip.
   */
  saveMethod(
    method: SavePaymentMethodRequest,
  ): Observable<SavePaymentMethodResponse> {
    return this.http
      .post<SavePaymentMethodResponse>(
        `${this.baseUrl}${API_ENDPOINTS.PAYMENT.SAVE}`,
        method,
        { params: { include_list: '1' } },
      )
      .pipe(catchError((err) => this.toAppError(err)));
  }

  /**
   * Loads the Redsys inSite JS SDK once per page. Subsequent callers get
   * the cached Promise. Resolves when `window.getInSiteFormData` is
   * available; rejects if the script fails to load.
   */
  loadRedsysScript(): Promise<void> {
    if (!this.insiteScriptUrl) {
      return Promise.reject(new Error('Redsys inSite script URL is not configured'));
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('Redsys inSite requires a browser environment'));
    }
    if (window.getInSiteFormData) {
      return Promise.resolve();
    }
    if (this.redsysScriptPromise) {
      return this.redsysScriptPromise;
    }

    this.redsysScriptPromise = new Promise<void>((resolve, reject) => {
      // If another caller injected the same tag already, reuse it.
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${this.insiteScriptUrl}"]`,
      );
      const script = existing ?? document.createElement('script');
      script.src = this.insiteScriptUrl;
      script.async = true;

      const onLoad = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        if (window.getInSiteFormData) {
          resolve();
        } else {
          reject(new Error('Redsys inSite script loaded but API is unavailable'));
        }
      };
      const onError = () => {
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        // Drop the cached promise so a future retry can re-attempt injection.
        this.redsysScriptPromise = undefined;
        reject(new Error('Failed to load Redsys inSite script'));
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);

      if (!existing) {
        document.head.appendChild(script);
      } else if (window.getInSiteFormData) {
        // Script already loaded between our check and this branch.
        onLoad();
      }
    });

    return this.redsysScriptPromise;
  }

  /**
   * Maps a raw Redsys inSite SDK success payload into our normalized
   * InSiteTokenResult shape. Extracted so the dialog component does not
   * have to know the exact SDK field names.
   */
  mapTokenResult(raw: RedsysInSiteResult): InSiteTokenResult {
    const masked = (raw.Ds_Card_Number as string | undefined) ?? '';
    const last4 = masked ? masked.replace(/\D/g, '').slice(-4) : undefined;
    return {
      idOper: (raw.Ds_Merchant_Identifier as string | undefined) ?? '',
      cofTxnid: raw.Ds_Merchant_Cof_Txnid as string | undefined,
      cardNumberMasked: masked || undefined,
      last4,
      cardBrand: raw.Ds_Card_Brand as string | undefined,
      cardCountry: raw.Ds_Card_Country as string | undefined,
      cardType: raw.Ds_Card_Type as string | undefined,
      expiryDate: raw.Ds_ExpiryDate as string | undefined,
      responseCode: (raw.Ds_Response as string | undefined) ?? '',
      authorisationCode: raw.Ds_AuthorisationCode as string | undefined,
    };
  }

  private toAppError(error: HttpErrorResponse | Error): Observable<never> {
    const appError: AppError =
      error instanceof HttpErrorResponse
        ? AppErrorFactory.fromHttpError(error)
        : AppErrorFactory.fromUnknown(error);
    return throwError(() => appError);
  }
}
