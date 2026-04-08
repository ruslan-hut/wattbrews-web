import { Component, DestroyRef, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInfoService } from '../../core/services/user-info.service';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo, PaymentPlan, UserTag, UserPaymentMethod } from '../../core/models/user-info.model';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';
import { DateUtils } from '../../shared/utils/date.utils';
import { PaymentService } from './payment/payment.service';
import {
  EditCardDialogComponent,
  EditCardDialogData,
  EditCardDialogResult,
} from './payment/edit-card-dialog/edit-card-dialog.component';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogData,
} from './payment/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-profile',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  protected readonly userInfoService = inject(UserInfoService);
  protected readonly authService = inject(AuthService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // Authentication state
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAuthLoading = this.authService.isLoading;
  protected readonly translationsLoading = signal(true);

  // Payment method CRUD state — separate from userInfoService.loading so
  // per-row spinners don't fight the whole-page loading spinner.
  protected readonly paymentRedirecting = signal(false);
  protected readonly paymentBusyIdentifier = signal<string | null>(null);
  protected readonly paymentError = signal<string | null>(null);

  /**
   * Regular users (`role === 'user'`) see a trimmed profile view: the
   * internal fields `username`, `role`, `access_level` and the
   * `User tags` tab are hidden. Admins and operators still see them.
   */
  protected isPrivilegedUser(): boolean {
    return this.userInfoService.getUserRole() !== 'user';
  }

  constructor() {
    // Subscribe to auth state changes to handle race conditions
    this.authService.user$
      .pipe(takeUntilDestroyed())
      .subscribe(user => {
        if (user && this.isAuthenticated()) {
          this.loadUserInfo();
        } else if (!user) {
          this.userInfoService.clearData();
        }
      });
  }

  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();

    // Also check immediately in case auth is already resolved
    if (this.isAuthenticated()) {
      this.loadUserInfo();
    }
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }

  protected refreshUserInfo(): void {
    this.userInfoService.clearError();
    this.loadUserInfo();
  }

  protected formatDate(date: Date | null): string {
    return DateUtils.formatDateTime(date) || 'N/A';
  }

  protected getDateFromString(dateString: string): Date | null {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return null;
    return new Date(dateString);
  }

  /**
   * Format a plain time value — used for payment-plan start/end times.
   * The backend sends strings like "09:00:00" (no date). Fall back to a
   * full datetime parse if the string is something else.
   */
  protected formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
    if (timeString.includes('T') || timeString.includes(' ')) {
      // Looks like an ISO / datetime string — run the full formatter.
      return DateUtils.formatTime(timeString) || timeString;
    }
    return DateUtils.formatTimeString(timeString) || timeString;
  }

  protected maskMerchantId(merchantId: string): string {
    if (!merchantId) return 'N/A';
    if (merchantId.length <= 4) return merchantId;
    return merchantId.substring(0, 4) + '****';
  }

  private loadUserInfo(): void {
    this.userInfoService.loadCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // Current user info loaded successfully
      },
      error: (error) => {
        // Error loading current user info - handled by service
      }
    });
  }

  /**
   * Navigate to login page
   */
  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // ------------------------------------------------------------------
  // Payment method CRUD — shares the same backend endpoints and dialog
  // components used on /profile/payment, so the behavior stays
  // consistent across both entry points.
  // ------------------------------------------------------------------

  protected async addPaymentMethod(): Promise<void> {
    if (this.paymentRedirecting()) return;
    this.paymentError.set(null);
    this.paymentRedirecting.set(true);
    try {
      await this.paymentService.startAddCardFlow(
        this.translationService.currentLanguage().toUpperCase() === 'EN' ? '002' : '001',
      );
    } catch (err) {
      console.error('[profile] failed to start add-card flow', err);
      this.paymentRedirecting.set(false);
      this.paymentError.set(
        this.translationService.getReactive('profile.paymentMethods.addCard.errorGeneric'),
      );
    }
  }

  protected editPaymentMethod(method: UserPaymentMethod): void {
    const data: EditCardDialogData = {
      description: method.description,
      is_default: method.is_default,
      subtitle: this.paymentMethodSubtitle(method),
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
        this.paymentBusyIdentifier.set(method.identifier);
        this.paymentError.set(null);
        const updated: UserPaymentMethod = {
          ...method,
          description: result.description,
          is_default: result.is_default,
        };
        this.paymentService
          .updateMethod(updated)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.refreshPaymentMethods(),
            error: (err) => {
              console.error('[profile] failed to update method', err);
              this.paymentBusyIdentifier.set(null);
              this.paymentError.set(
                this.translationService.getReactive('profile.paymentMethods.updateError'),
              );
            },
          });
      });
  }

  protected deletePaymentMethod(method: UserPaymentMethod): void {
    const data: ConfirmDeleteDialogData = {
      titleKey: 'profile.paymentMethods.delete.title',
      messageKey: 'profile.paymentMethods.delete.message',
      subject: this.paymentMethodSubtitle(method),
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
        this.paymentBusyIdentifier.set(method.identifier);
        this.paymentError.set(null);
        this.paymentService
          .deleteMethod(method)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.refreshPaymentMethods(),
            error: (err) => {
              console.error('[profile] failed to delete method', err);
              this.paymentBusyIdentifier.set(null);
              this.paymentError.set(
                this.translationService.getReactive('profile.paymentMethods.deleteError'),
              );
            },
          });
      });
  }

  private refreshPaymentMethods(): void {
    this.userInfoService
      .loadCurrentUserInfo({ include_payment_methods: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.paymentBusyIdentifier.set(null),
        error: () => this.paymentBusyIdentifier.set(null),
      });
  }

  private paymentMethodSubtitle(method: UserPaymentMethod): string {
    const brand = this.userInfoService.getCardBrandName(method.card_brand);
    const last4 = method.identifier ? method.identifier.slice(-4) : '';
    return last4 ? `${brand} •••• ${last4}` : brand;
  }
}
