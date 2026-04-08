import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserInfoService } from '../../../core/services/user-info.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { AddCardDialogComponent, AddCardDialogResult } from './add-card-dialog/add-card-dialog.component';

/**
 * /profile/payment — list of the user's saved payment methods plus the
 * entry point for the Redsys inSite "add card" flow. The list itself is
 * sourced from `UserInfoService` (same signal the main profile page uses),
 * so adding or removing cards is reflected everywhere in one place.
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
  private readonly dialog = inject(MatDialog);
  protected readonly userInfoService = inject(UserInfoService);
  protected readonly translationService = inject(SimpleTranslationService);

  protected readonly methods = this.userInfoService.activePaymentMethods;
  protected readonly loading = this.userInfoService.loading;
  protected readonly hasMethods = computed(() => this.methods().length > 0);

  ngOnInit(): void {
    // Cheap no-op if the cache is already warm; otherwise loads the list
    // so users navigating straight to /profile/payment see their cards.
    if (this.methods().length === 0 && !this.userInfoService.userInfo()) {
      this.userInfoService
        .loadCurrentUserInfo({ include_payment_methods: true })
        .subscribe({ error: () => void 0 });
    }
  }

  protected openAddCardDialog(): void {
    const ref = this.dialog.open<AddCardDialogComponent, void, AddCardDialogResult>(
      AddCardDialogComponent,
      {
        disableClose: true,
        width: '520px',
        maxWidth: '95vw',
      },
    );
    // AddCardDialogComponent already refreshes UserInfoService on success,
    // so there's nothing to do here besides ignore the result.
    ref.afterClosed().subscribe();
  }

  protected brandName(brand: string): string {
    return this.userInfoService.getCardBrandName(brand);
  }

  protected expiry(date: string): string {
    return this.userInfoService.formatExpiryDate(date);
  }
}
