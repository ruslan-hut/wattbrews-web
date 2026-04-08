import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
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
import { InSiteOrderResponse } from '../../../../core/models/payment.model';
import { PaymentService } from '../payment.service';

/**
 * Result returned to the caller when the dialog closes. `success: true`
 * means a new card was saved and the user-info cache was refreshed.
 */
export interface AddCardDialogResult {
  success: boolean;
}

type DialogStatus =
  | 'loading' // fetching signed order + loading Redsys SDK
  | 'idle' // Redsys form mounted, waiting for user to submit
  | 'tokenizing' // /payment/tokenize in flight
  | 'success'
  | 'error';

interface DialogState {
  status: DialogStatus;
  errorMessage?: string;
}

/** Container id for the Redsys unified form iframe. */
const CARD_FORM_ID = 'card-form';
/** Hidden input ids that storeIdOper populates on success/error. */
const TOKEN_INPUT_ID = 'redsys-token';
const ERROR_INPUT_ID = 'redsys-errorCode';
/** Merchant-side validator stub. Must return true for storeIdOper to
 *  accept the message, but we have no client-side validation to do. */
const ALLOW_ALL_VALIDATOR = () => true;

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
export class AddCardDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);
  private readonly userInfoService = inject(UserInfoService);
  private readonly dialogRef = inject(MatDialogRef<AddCardDialogComponent, AddCardDialogResult>);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly translationService = inject(SimpleTranslationService);

  protected readonly cardFormId = CARD_FORM_ID;
  protected readonly tokenInputId = TOKEN_INPUT_ID;
  protected readonly errorInputId = ERROR_INPUT_ID;

  /** Optional label so the user can tell cards apart in the list. */
  protected readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.maxLength(64)]],
  });

  protected readonly state = signal<DialogState>({ status: 'loading' });

  private order?: InSiteOrderResponse;
  /** Reference to the message listener so we can detach it on destroy. */
  private messageListener?: (event: MessageEvent) => void;

  ngOnInit(): void {
    void this.bootstrap();
  }

  ngOnDestroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = undefined;
    }
  }

  /**
   * Runs once when the dialog opens: loads the Redsys inSite JS SDK,
   * creates a signed order on the backend, attaches the `message`
   * listener, then asks Redsys to mount the card form iframe.
   *
   * IMPORTANT: the listener must be attached BEFORE we call
   * `getInSiteFormJSON`, otherwise we would miss the message event
   * Redsys posts when the user submits.
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
          this.attachMessageListener();
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
   * Installs a `message` event listener that routes the Redsys post
   * through `storeIdOper` (which populates the hidden inputs) and then
   * reads the result. We use the hidden inputs as a synchronization
   * point because that is exactly how the official Redsys sample HTML
   * works — we don't want to parse `event.data` directly because its
   * shape is not documented.
   */
  private attachMessageListener(): void {
    if (this.messageListener) {
      return;
    }
    this.messageListener = (event: MessageEvent) => {
      if (!window.storeIdOper) {
        return;
      }
      try {
        window.storeIdOper(event, TOKEN_INPUT_ID, ERROR_INPUT_ID, ALLOW_ALL_VALIDATOR);
      } catch (err) {
        console.warn('[add-card] storeIdOper threw', err);
        return;
      }
      const tokenEl = document.getElementById(TOKEN_INPUT_ID) as HTMLInputElement | null;
      const errorEl = document.getElementById(ERROR_INPUT_ID) as HTMLInputElement | null;
      const token = tokenEl?.value?.trim() ?? '';
      const errorCode = errorEl?.value?.trim() ?? '';
      if (token) {
        // Clear the hidden input so a second submit can't re-use it.
        if (tokenEl) tokenEl.value = '';
        this.onTokenReceived(token);
      } else if (errorCode) {
        if (errorEl) errorEl.value = '';
        this.onTokenError(errorCode);
      }
    };
    window.addEventListener('message', this.messageListener);
  }

  /**
   * Calls the Redsys SDK to mount the unified card entry form inside
   * our container div. Redsys draws its own pay button inside the
   * iframe — we don't render a Save button ourselves.
   */
  private mountRedsysForm(order: InSiteOrderResponse): void {
    if (!window.getInSiteFormJSON) {
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
      return;
    }
    try {
      window.getInSiteFormJSON({
        id: CARD_FORM_ID,
        fuc: order.merchant_code,
        terminal: order.terminal,
        order: order.order_number,
        buttonValue: this.translationService.getReactive(
          'profile.paymentMethods.addCard.submit',
        ),
        idiomaInsite: this.redsysLanguageCode(),
        estiloInsite: 'twoRows',
      });
    } catch (err) {
      console.error('[add-card] getInSiteFormJSON threw', err);
      this.state.set({
        status: 'error',
        errorMessage: this.translationService.getReactive(
          'profile.paymentMethods.addCard.errorScript',
        ),
      });
    }
  }

  private redsysLanguageCode(): string {
    const lang = this.translationService.currentLanguage();
    return lang.toUpperCase() === 'ES' ? 'ES' : 'EN';
  }

  private onTokenReceived(idOper: string): void {
    if (!this.order) {
      return;
    }
    this.state.set({ status: 'tokenizing' });

    this.paymentService
      .tokenizeCard({
        order: this.order.order,
        id_oper: idOper,
        description: this.form.controls.description.value.trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Refresh the user-info cache so the profile page / computed
          // signals pick up the new method without a full page reload.
          this.userInfoService
            .loadCurrentUserInfo({ include_payment_methods: true })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.finishSuccess(),
              error: () => this.finishSuccess(),
            });
        },
        error: (err) => {
          console.error('[add-card] /payment/tokenize failed', err);
          this.state.set({
            status: 'error',
            errorMessage: this.translationService.getReactive(
              'profile.paymentMethods.addCard.errorGeneric',
            ),
          });
        },
      });
  }

  private finishSuccess(): void {
    this.state.set({ status: 'success' });
    setTimeout(() => this.dialogRef.close({ success: true }), 1200);
  }

  private onTokenError(code: string): void {
    console.warn('[add-card] Redsys inSite error', code);
    this.state.set({
      status: 'error',
      errorMessage: this.translationService.getReactive(
        'profile.paymentMethods.addCard.errorGeneric',
      ),
    });
  }

  protected retry(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = undefined;
    }
    this.state.set({ status: 'loading' });
    void this.bootstrap();
  }

  protected cancel(): void {
    this.dialogRef.close({ success: false });
  }
}
