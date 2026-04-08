import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../../core/constants/app.constants';
import { AppError, AppErrorFactory } from '../../../core/models/error.model';
import {
  PaymentOrderRequest,
  SavePaymentMethodRequest,
  SavePaymentMethodResponse,
  WebOrderResponse,
} from '../../../core/models/payment.model';

/**
 * PaymentService owns the HTTP calls for the web "add card" redirect
 * flow. The backend returns raw JSON (not the wrapped `{success,data}`
 * shape `ApiService.post` assumes), so we use HttpClient directly —
 * this mirrors how `UserInfoService` uses `apiService.getDirect`.
 *
 * There is no JS SDK to load: the entire card form lives on Redsys'
 * hosted page. We just POST a signed form and let the browser
 * navigate away.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Creates a Redsys TPV Virtual hosted-form order server-side. The
   * backend signs the merchant parameters and returns the form URL
   * plus the `Ds_*` triplet. The caller should hand the response to
   * `submitRedsysForm()` to navigate the browser to Redsys.
   */
  createWebOrder(
    req: Omit<PaymentOrderRequest, 'mode'>,
  ): Observable<WebOrderResponse> {
    const body: PaymentOrderRequest = { ...req, mode: 'web' };
    return this.http
      .post<WebOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PAYMENT.ORDER}`, body)
      .pipe(catchError((err) => this.toAppError(err)));
  }

  /**
   * Builds a hidden `<form>`, injects the three signed hidden inputs,
   * appends it to the document, and submits it. This causes a full
   * page navigation to Redsys' card entry host. On return, Redsys
   * points the browser at the `return_url_ok` / `return_url_ko` URLs
   * that were passed to createWebOrder.
   */
  submitRedsysForm(order: WebOrderResponse): void {
    if (typeof document === 'undefined') {
      throw new Error('submitRedsysForm requires a browser environment');
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = order.form_url;
    form.style.display = 'none';

    const fields: Record<string, string> = {
      Ds_SignatureVersion: order.Ds_SignatureVersion,
      Ds_MerchantParameters: order.Ds_MerchantParameters,
      Ds_Signature: order.Ds_Signature,
    };
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Persists a tokenized card directly — used by flows that already
   * hold a permanent card token (e.g. imports or migrations). The
   * normal "add card" flow doesn't call this; the Redsys notify
   * webhook saves the method server-side.
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

  private toAppError(error: HttpErrorResponse | Error): Observable<never> {
    const appError: AppError =
      error instanceof HttpErrorResponse
        ? AppErrorFactory.fromHttpError(error)
        : AppErrorFactory.fromUnknown(error);
    return throwError(() => appError);
  }
}
