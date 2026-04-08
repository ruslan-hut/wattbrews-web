import { UserPaymentMethod } from './user-info.model';

/**
 * Request body for POST /payment/order.
 *
 * For the Redsys inSite web flow set `mode` to `"insite"`; the backend will
 * then return the additional `Ds_*` triplet needed to drive the Redsys JS
 * SDK. Android and other native callers omit `mode` and receive the legacy
 * PaymentOrder shape.
 */
export interface PaymentOrderRequest {
  transaction_id?: number;
  order?: number;
  amount: number; // cents (Redsys expects an integer amount in the smallest currency unit)
  currency: string; // ISO 4217 numeric code, e.g. "978" for EUR
  description?: string;
  identifier?: string;
  mode?: 'insite';
}

/**
 * Response from POST /payment/order when `mode === "insite"`.
 *
 * The embedded `PaymentOrder` fields are flattened at the top level by the
 * backend (see `entity.InSiteOrderResponse`), but we only care about the
 * pieces the browser actually needs to feed into the Redsys inSite SDK.
 */
export interface InSiteOrderResponse {
  order: number;
  amount: number;
  currency: string;
  description: string;
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
  merchant_code: string;
  terminal: string;
  order_number: string; // 12-digit normalized order string
}

/**
 * Request body for POST /payment/save — shape matches the existing
 * `UserPaymentMethod` read model so we can reuse its type.
 */
export type SavePaymentMethodRequest = Partial<UserPaymentMethod> &
  Pick<UserPaymentMethod, 'identifier'>;

/**
 * Response from POST /payment/save?include_list=1 used by the web flow.
 * The backend returns `{ saved, methods }`; Android ignores this query flag
 * and keeps getting a single method object.
 */
export interface SavePaymentMethodResponse {
  saved: UserPaymentMethod;
  methods: UserPaymentMethod[];
}

/**
 * Normalized outcome of the Redsys inSite tokenization step, mapped from the
 * raw Redsys SDK callback payload in PaymentService.
 */
export interface InSiteTokenResult {
  idOper: string; // DS_MERCHANT_IDENTIFIER — our stored card token
  cofTxnid?: string; // DS_MERCHANT_COF_TXNID — initial COF id, needed for MIT
  cardNumberMasked?: string; // masked PAN, e.g. "************3456"
  last4?: string; // convenience, parsed from the masked PAN
  cardBrand?: string; // Redsys numeric brand code: "1" VISA, "2" MC, ...
  cardCountry?: string; // ISO 3166 numeric
  cardType?: string; // "CREDIT" | "DEBIT"
  expiryDate?: string; // YYMM
  responseCode: string; // e.g. "0000" on success
  authorisationCode?: string;
}
