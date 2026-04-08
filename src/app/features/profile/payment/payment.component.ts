import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserInfoService } from '../../../core/services/user-info.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { UserPaymentMethod } from '../../../core/models/user-info.model';
import { PaymentService } from './payment.service';
import {
  EditCardDialogComponent,
  EditCardDialogData,
  EditCardDialogResult,
} from './edit-card-dialog/edit-card-dialog.component';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
} from './confirm-delete-dialog/confirm-delete-dialog.component';

/**
 * /profile/payment — list of the user's saved payment methods plus
 * add / edit / delete actions. Adding a card kicks off the Redsys
 * TPV Virtual hosted-form redirect; edit and delete call the
 * authenticated backend endpoints directly and refresh the
 * UserInfoService cache so the list updates in place.
 */
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly methods = this.userInfoService.activePaymentMethods;
  protected readonly loading = this.userInfoService.loading;
  protected readonly hasMethods = computed(() => this.methods().length > 0);
  protected readonly redirecting = signal(false);
  protected readonly busyIdentifier = signal<string | null>(null);
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

  protected async addCard(): Promise<void> {
    if (this.redirecting()) {
      return;
    }
    this.errorMessage.set(null);
    this.redirecting.set(true);
    try {
      await this.paymentService.startAddCardFlow(
        this.translationService.currentLanguage().toUpperCase() === 'EN' ? '002' : '001',
      );
    } catch (err) {
      console.error('[payment] failed to start add-card flow', err);
      this.redirecting.set(false);
      this.errorMessage.set(
        this.translationService.getReactive('profile.paymentMethods.addCard.errorGeneric'),
      );
    }
  }

  protected editMethod(method: UserPaymentMethod): void {
    const data: EditCardDialogData = {
      description: method.description,
      is_default: method.is_default,
      subtitle: this.methodSubtitle(method),
    };
    this.dialog
      .open<EditCardDialogComponent, EditCardDialogData, EditCardDialogResult | undefined>(
        EditCardDialogComponent,
        { data, width: '440px', maxWidth: '95vw' },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) return;
        this.applyUpdate(method, result);
      });
  }

  protected deleteMethod(method: UserPaymentMethod): void {
    const data: ConfirmDeleteDialogData = {
      titleKey: 'profile.paymentMethods.delete.title',
      messageKey: 'profile.paymentMethods.delete.message',
      subject: this.methodSubtitle(method),
    };
    this.dialog
      .open<ConfirmDeleteDialogComponent, ConfirmDeleteDialogData, boolean>(
        ConfirmDeleteDialogComponent,
        { data, width: '440px', maxWidth: '95vw' },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.applyDelete(method);
      });
  }

  private applyUpdate(method: UserPaymentMethod, changes: EditCardDialogResult): void {
    this.busyIdentifier.set(method.identifier);
    this.errorMessage.set(null);
    const updated: UserPaymentMethod = {
      ...method,
      description: changes.description,
      is_default: changes.is_default,
    };
    this.paymentService
      .updateMethod(updated)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.refreshAfterMutation(),
        error: (err) => {
          console.error('[payment] failed to update method', err);
          this.busyIdentifier.set(null);
          this.errorMessage.set(
            this.translationService.getReactive('profile.paymentMethods.updateError'),
          );
        },
      });
  }

  private applyDelete(method: UserPaymentMethod): void {
    this.busyIdentifier.set(method.identifier);
    this.errorMessage.set(null);
    this.paymentService
      .deleteMethod(method)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.refreshAfterMutation(),
        error: (err) => {
          console.error('[payment] failed to delete method', err);
          this.busyIdentifier.set(null);
          this.errorMessage.set(
            this.translationService.getReactive('profile.paymentMethods.deleteError'),
          );
        },
      });
  }

  private refreshAfterMutation(): void {
    this.userInfoService
      .loadCurrentUserInfo({ include_payment_methods: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.busyIdentifier.set(null),
        error: () => this.busyIdentifier.set(null),
      });
  }

  protected brandName(brand: string): string {
    return this.userInfoService.getCardBrandName(brand);
  }

  protected expiry(date: string): string {
    return this.userInfoService.formatExpiryDate(date);
  }

  protected methodSubtitle(method: UserPaymentMethod): string {
    const brand = this.brandName(method.card_brand);
    const last4 = method.identifier ? method.identifier.slice(-4) : '';
    return last4 ? `${brand} •••• ${last4}` : brand;
  }
}
