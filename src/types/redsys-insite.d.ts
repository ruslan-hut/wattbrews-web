/**
 * Ambient declarations for the Redsys inSite JavaScript SDK.
 *
 * The SDK is loaded dynamically (see PaymentService.loadRedsysScript) because
 * it is only needed on the "add card" dialog and we don't want it blocking
 * the initial bundle. The types below are a *minimal* surface — enough for
 * the add-card flow — and intentionally conservative: anything not
 * explicitly documented by Redsys is typed as `unknown` / `any` so we do not
 * claim guarantees the SDK doesn't make.
 *
 * Reference: https://pagosonline.redsys.es/desarrolladores-inicio/documentacion-tipos-de-integracion/desarrolladores-insite/
 */
export {};

declare global {
  /**
   * Options passed to createInSiteForm / getInSiteFormData. The exact
   * property names vary slightly between Redsys SDK builds; keep this
   * permissive so consumers can pass whatever the downloaded sample
   * HTML demonstrates.
   */
  interface RedsysInSiteOptions {
    [key: string]: unknown;
  }

  /**
   * Result passed to the success callback of getInSiteFormData. Only the
   * fields we actually consume in PaymentService are typed strictly.
   */
  interface RedsysInSiteResult {
    Ds_Merchant_Identifier?: string;
    Ds_Merchant_Cof_Txnid?: string;
    Ds_Card_Number?: string;
    Ds_Card_Brand?: string;
    Ds_Card_Country?: string;
    Ds_Card_Type?: string;
    Ds_ExpiryDate?: string;
    Ds_Response?: string;
    Ds_AuthorisationCode?: string;
    [key: string]: unknown;
  }

  interface RedsysInSiteError {
    errorCode?: string;
    errorMessage?: string;
    [key: string]: unknown;
  }

  interface Window {
    /**
     * Builds the iframe-backed card entry form inside the supplied container
     * elements. Called once after the SDK script has loaded.
     */
    createInSiteForm?: (options: RedsysInSiteOptions) => void;

    /**
     * Submits the tokenization request to Redsys. `onSuccess` receives the
     * card identifier and metadata; `onError` receives a Redsys error code.
     */
    getInSiteFormData?: (
      options: RedsysInSiteOptions,
      onSuccess: (result: RedsysInSiteResult) => void,
      onError: (error: RedsysInSiteError) => void,
    ) => void;
  }
}
