import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserInfoService } from '../../../core/services/user-info.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { PaymentService } from './payment.service';

/**
 * /profile/payment — list of the user's saved payment methods plus the
 * entry point for the Redsys TPV Virtual redirect "add card" flow. The
 * list itself is sourced from `UserInfoService` (same signal the main
 * profile page uses), so adding or removing cards is reflected
 * everywhere in one place.
 *
 * Clicking "Add card" POSTs to the backend to obtain a signed Redsys
 * payload and then auto-submits an HTML form, causing a full-page
 * navigation to Redsys's hosted card entry page. After the user
 * completes entry + 3DS, Redsys delivers the permanent card token to
 * the backend's notify endpoint and redirects the browser back to
 * `/profile/payment/redsys-return`.
 */
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent implements OnInit {
  protected readonly userInfoService = inject(UserInfoService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly paymentService = inject(PaymentService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly methods = this.userInfoService.activePaymentMethods;
  protected readonly loading = this.userInfoService.loading;
  protected readonly hasMethods = computed(() => this.methods().length > 0);
  protected readonly redirecting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Cheap no-op if the cache is already warm; otherwise loads the list
    // so users navigating straight to /profile/payment see their cards.
    if (this.methods().length === 0 && !this.userInfoService.userInfo()) {
      this.userInfoService
        .loadCurrentUserInfo({ include_payment_methods: true })
        .subscribe({ error: () => void 0 });
    }
  }

  protected addCard(): void {
    if (this.redirecting()) {
      return;
    }
    this.errorMessage.set(null);
    this.redirecting.set(true);

    const origin = window.location.origin;
    const returnBase = `${origin}/profile/payment/redsys-return`;

    this.paymentService
      .createWebOrder({
        // Zero-amount tokenization — matches the Android flow. Redsys
        // issues a permanent card reference without authorizing money.
        amount: 0,
        currency: '978',
        description: 'Card registration',
        return_url_ok: `${returnBase}?result=ok`,
        return_url_ko: `${returnBase}?result=ko`,
        language: this.translationService.currentLanguage().toUpperCase() === 'EN' ? '002' : '001',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => this.paymentService.submitRedsysForm(order),
        error: (err) => {
          console.error('[payment] failed to create Redsys order', err);
          this.redirecting.set(false);
          this.errorMessage.set(
            this.translationService.getReactive('profile.paymentMethods.addCard.errorGeneric'),
          );
        },
      });
  }

  protected brandName(brand: string): string {
    return this.userInfoService.getCardBrandName(brand);
  }

  protected expiry(date: string): string {
    return this.userInfoService.formatExpiryDate(date);
  }
}
