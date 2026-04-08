/**
 * Ambient declarations for the Redsys inSite JavaScript SDK.
 *
 * The SDK is loaded dynamically (see PaymentService.loadRedsysScript) and
 * exposes a handful of globals on `window`. The minimal surface typed
 * below is exactly what the "add card" dialog uses.
 *
 * The unified-form API (single container hosting card number + expiry +
 * CVV + pay button) is what we use — it's the simplest integration and
 * draws its own submit button, so we don't need independent-element
 * wiring like `getCardInput` / `getPayButton`.
 *
 * Flow:
 *   1. `getInSiteFormJSON({ id, fuc, terminal, order, ... })` mounts the
 *      iframe-backed card form inside the element with id `options.id`.
 *   2. User enters card details and clicks the Redsys pay button.
 *   3. Redsys posts a `message` event to `window` containing either an
 *      `idOper` (success) or an `errorCode` (failure).
 *   4. Our listener routes the event through `storeIdOper(event, "token",
 *      "errorCode", validator)` which writes the result into two hidden
 *      `<input>` elements with the matching ids.
 *
 * Reference: https://sis-d.redsys.es/websantander/conexion-insite.html
 */
export {};

declare global {
  interface RedsysInSiteFormOptions {
    /** id of the container element that will host the card iframe. */
    id: string;
    /** Merchant code (FUC). Must be a string. */
    fuc: string;
    /** Terminal number. Must be a string. */
    terminal: string;
    /** Merchant order number. Must be a string (normalized, 12 digits). */
    order: string;

    // Optional styling / i18n fields (kept loose — all strings, all optional).
    styleButton?: string;
    styleBody?: string;
    styleBox?: string;
    styleBoxText?: string;
    buttonValue?: string;
    idiomaInsite?: string;
    mostrarLogo?: boolean;
    estiloReducidoInsite?: boolean;
    estiloInsite?: 'inline' | 'twoRows' | string;
  }

  /**
   * Signature of the user-supplied merchant-side validator invoked by
   * `storeIdOper` before it writes the idOper to the hidden input.
   * Returning `false` aborts storage.
   */
  type RedsysInSiteValidator = () => boolean;

  interface Window {
    /**
     * Renders the unified card entry iframe inside the element whose id
     * is `options.id`. No return value — the form posts a `message`
     * event when the user submits.
     */
    getInSiteFormJSON?: (options: RedsysInSiteFormOptions) => void;

    /**
     * Utility provided by redsysV3.js. When called from inside a
     * `message` event listener it reads `event.data`, extracts the
     * operation id (or error code), validates it via the supplied
     * validator, and writes the result into the hidden inputs whose
     * ids are `tokenInputId` and `errorInputId`.
     */
    storeIdOper?: (
      event: MessageEvent,
      tokenInputId: string,
      errorInputId: string,
      validator: RedsysInSiteValidator,
    ) => void;
  }
}
