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
 * Response from POST /payment/order when `mode === "insite"`. The backend
 * only needs to hand the browser the three identifiers required by
 * Redsys `getInSiteFormJSON({ fuc, terminal, order })` — no signing, no
 * pre-computed `Ds_*` payload, because inSite does not use them.
 *
 * `order` is the integer order id we use internally (e.g. to look up
 * the stored PaymentOrder from /payment/tokenize); `order_number` is the
 * 12-digit zero-padded string Redsys expects in the `order` option.
 */
export interface InSiteOrderResponse {
  order: number;
  amount: number;
  currency: string;
  description: string;
  merchant_code: string;
  terminal: string;
  order_number: string;
}

/**
 * Request body for POST /payment/tokenize. Sent by the web client once
 * the Redsys inSite SDK has handed back a temporary idOper (valid for
 * 30 minutes). The backend then calls Redsys REST with
 * DS_MERCHANT_IDOPER to exchange it for a permanent card token.
 */
export interface TokenizeCardRequest {
  order: number;
  id_oper: string;
  description?: string;
}

/**
 * Request body for POST /payment/save — shape matches the existing
 * `UserPaymentMethod` read model so we can reuse its type.
 */
export type SavePaymentMethodRequest = Partial<UserPaymentMethod> &
  Pick<UserPaymentMethod, 'identifier'>;

/**
 * Response from POST /payment/save?include_list=1 and POST /payment/tokenize.
 * Both endpoints return `{ saved, methods }` on the web path. Android
 * ignores `include_list` on /payment/save and keeps getting a single
 * method object; it never calls /payment/tokenize.
 */
export interface SavePaymentMethodResponse {
  saved: UserPaymentMethod;
  methods: UserPaymentMethod[];
}
