import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SimpleTranslationService } from '../../../../core/services/simple-translation.service';
import { UserInfoService } from '../../../../core/services/user-info.service';
import {
  InSiteOrderResponse,
  InSiteTokenResult,
  SavePaymentMethodRequest,
} from '../../../../core/models/payment.model';
import { PaymentService } from '../payment.service';

/**
 * Result returned to the caller when the dialog closes. `success: true`
 * means a new card was saved and the user-info cache was refreshed.
 * `success: false` covers both user-cancelled and error exits.
 */
export interface AddCardDialogResult {
  success: boolean;
}

type DialogStatus =
  | 'loading' // fetching signed order + loading Redsys SDK
  | 'idle' // iframes ready, waiting for user input
  | 'tokenizing' // Redsys is running 3DS / authorization
  | 'saving' // backend is persisting the token
  | 'success'
  | 'error';

interface DialogState {
  status: DialogStatus;
  errorMessage?: string;
}

/**
 * Redsys user-cancelled error code. We intentionally treat this as a silent
 * close, matching what the Android app does in `PaymentResultImpl`.
 */
const REDSYS_CANCEL_CODE = '5551';

@Component({
  selector: 'app-add-card-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-card-dialog.component.html',
  styleUrl: './add-card-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCardDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly userInfoService = inject(UserInfoService);
  private readonly dialogRef = inject(MatDialogRef<AddCardDialogComponent, AddCardDialogResult>);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly translationService = inject(SimpleTranslationService);

  // Optional label so the user can tell cards apart in the list.
  protected readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.maxLength(64)]],
  });

  protected readonly state = signal<DialogState>({ status: 'loading' });
  private order?: InSiteOrderResponse;

  ngOnInit(): void {
    void this.bootstrap();
  }

  /**
   * Runs once when the dialog opens: creates the signed inSite order on
   * the backend, loads the Redsys JS SDK, then hands control to the
   * Redsys iframes by calling `window.createInSiteForm`.
   */
  private async bootstrap(): Promise<void> {
    try {
      await this.paymentService.loadRedsysScript();
    } catch (err) {
      console.error('[add-card] failed to load Redsys SDK', err);
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
      return;
    }

    this.paymentService
      .createInSiteOrder({
        // Zero-amount tokenization — matches the Android flow. Redsys
        // issues a card reference without actually authorizing any money.
        amount: 0,
        currency: '978',
        description: 'Card registration',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order = order;
          this.mountRedsysForm(order);
          this.state.set({ status: 'idle' });
        },
        error: (err) => {
          console.error('[add-card] failed to create order', err);
          this.state.set({
            status: 'error',
            errorMessage: this.translationService.getReactive(
              'profile.paymentMethods.addCard.errorNetwork',
            ),
          });
        },
      });
  }

  /**
   * Asks the Redsys SDK to render its iframe card inputs into the
   * containers declared in the template. Exact option names in the
   * inSite SDK vary slightly between builds — we pass the signed order
   * plus the container ids and let Redsys do the rest.
   */
  private mountRedsysForm(order: InSiteOrderResponse): void {
    if (!window.createInSiteForm) {
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
      return;
    }
    try {
      window.createInSiteForm({
        merchantCode: order.merchant_code,
        terminal: order.terminal,
        order: order.order_number,
        Ds_SignatureVersion: order.Ds_SignatureVersion,
        Ds_MerchantParameters: order.Ds_MerchantParameters,
        Ds_Signature: order.Ds_Signature,
        // Container element ids that our template renders.
        cardNumberContainer: 'redsys-card-number',
        expiryContainer: 'redsys-expiry',
        cvvContainer: 'redsys-cvv',
      });
    } catch (err) {
      console.error('[add-card] createInSiteForm threw', err);
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
    }
  }

  protected submit(): void {
    if (!this.order || this.state().status !== 'idle') {
      return;
    }
    if (!window.getInSiteFormData) {
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
      return;
    }

    this.state.set({ status: 'tokenizing' });

    window.getInSiteFormData(
      {
        merchantCode: this.order.merchant_code,
        terminal: this.order.terminal,
        order: this.order.order_number,
        Ds_SignatureVersion: this.order.Ds_SignatureVersion,
        Ds_MerchantParameters: this.order.Ds_MerchantParameters,
        Ds_Signature: this.order.Ds_Signature,
      },
      (result) => this.handleTokenSuccess(result),
      (error) => this.handleTokenError(error),
    );
  }

  private handleTokenSuccess(raw: RedsysInSiteResult): void {
    const token = this.paymentService.mapTokenResult(raw);
    if (!token.idOper) {
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorGeneric',
        ),
      });
      return;
    }
    this.state.set({ status: 'saving' });
    this.persistCard(token);
  }

  private handleTokenError(error: RedsysInSiteError): void {
    const code = error?.errorCode ?? '';
    if (code === REDSYS_CANCEL_CODE) {
      // User cancelled — silent close, matches Android behavior.
      this.dialogRef.close({ success: false });
      return;
    }
    console.warn('[add-card] Redsys tokenization failed', error);
    this.state.set({
      status: 'error',
      errorMessage: this.translationService.getReactive(
        'profile.paymentMethods.addCard.errorGeneric',
      ),
    });
  }

  private persistCard(token: InSiteTokenResult): void {
    const method: SavePaymentMethodRequest = {
      identifier: token.idOper,
      description: this.form.controls.description.value.trim() || 'Card',
      card_number: token.last4 ?? '',
      card_brand: token.cardBrand ?? '',
      card_country: token.cardCountry ?? '',
      expiry_date: token.expiryDate ?? '',
      merchant_cof_txnid: token.cofTxnid ?? '',
      is_default: false,
      fail_count: 0,
    };

    this.paymentService
      .saveMethod(method)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Refresh the user-info cache so the profile page / computed
          // signals pick up the new method without a full page reload.
          this.userInfoService
            .loadCurrentUserInfo({ include_payment_methods: true })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.state.set({ status: 'success' });
                setTimeout(() => this.dialogRef.close({ success: true }), 1200);
              },
              error: () => {
                // Save succeeded — treat cache-refresh failure as success.
                this.state.set({ status: 'success' });
                setTimeout(() => this.dialogRef.close({ success: true }), 1200);
              },
            });
        },
        error: (err) => {
          console.error('[add-card] failed to save method', err);
          this.state.set({
            status: 'error',
            errorMessage: this.translationService.getReactive(
              'profile.paymentMethods.addCard.errorGeneric',
            ),
          });
        },
      });
  }

  protected retry(): void {
    this.state.set({ status: 'loading' });
    void this.bootstrap();
  }

  protected cancel(): void {
    this.dialogRef.close({ success: false });
  }
}
