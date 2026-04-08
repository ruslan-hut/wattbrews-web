import { UserPaymentMethod } from './user-info.model';

/**
 * Request body for POST /payment/order.
 *
 * For the web "add card" flow (Redsys TPV Virtual redirect) set
 * `mode: "web"` and include `return_url_ok` / `return_url_ko`. The
 * backend responds with a signed payload the browser auto-POSTs to
 * Redsys' hosted card form. Android and other native callers omit
 * `mode` and receive the legacy PaymentOrder shape.
 */
export interface PaymentOrderRequest {
  transaction_id?: number;
  order?: number;
  amount: number; // cents, 0 for zero-auth tokenization
  currency: string; // ISO 4217 numeric code, e.g. "978" for EUR
  description?: string;
  identifier?: string;
  mode?: 'web';
  return_url_ok?: string;
  return_url_ko?: string;
  language?: string; // Redsys numeric language code, e.g. "001" ES, "002" EN
}

/**
 * Response from POST /payment/order when `mode === "web"`. The backend
 * has signed the Redsys TPV Virtual hosted-form payload; the frontend
 * must auto-submit an HTML form to `form_url` with the three Ds_*
 * fields as hidden inputs. The browser navigates away to Redsys.
 *
 * After the user completes the flow, Redsys redirects the browser to
 * `return_url_ok` (or `return_url_ko`) and in parallel POSTs the
 * authoritative result to the backend's notify endpoint, which stores
 * the new PaymentMethod.
 */
export interface WebOrderResponse {
  order: number;
  amount: number;
  currency: string;
  description: string;
  form_url: string;
  Ds_SignatureVersion: string;
  Ds_MerchantParameters: string;
  Ds_Signature: string;
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
