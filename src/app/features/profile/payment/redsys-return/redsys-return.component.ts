import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserInfoService } from '../../../../core/services/user-info.service';
import { SimpleTranslationService } from '../../../../core/services/simple-translation.service';

/**
 * /profile/payment/redsys-return — landing page after the user finishes
 * card entry on Redsys' hosted form. Redsys redirects the browser here
 * with `?result=ok` or `?result=ko`, while in parallel delivering the
 * authoritative signed response to the backend's /payment/notify
 * endpoint. The backend stores the new PaymentMethod; this component
 * only displays the outcome and refreshes the user-info cache so the
 * next navigation to /profile/payment shows the new card.
 */
type ReturnStatus = 'loading' | 'success' | 'failure';

@Component({
  selector: 'app-redsys-return',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './redsys-return.component.html',
  styleUrl: './redsys-return.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedsysReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userInfoService = inject(UserInfoService);
  protected readonly translationService = inject(SimpleTranslationService);

  protected readonly status = signal<ReturnStatus>('loading');

  ngOnInit(): void {
    const result = this.route.snapshot.queryParamMap.get('result');
    if (result === 'ok') {
      // Give the backend a beat to process the notify POST, then refresh
      // the cache. Redsys usually hits /payment/notify before redirecting
      // the browser, so in practice the card is already stored by now.
      this.userInfoService
        .loadCurrentUserInfo({ include_payment_methods: true })
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: () => this.status.set('success'),
          // A refresh failure doesn't invalidate the tokenization; the
          // card is persisted server-side regardless. Show success anyway.
          error: () => this.status.set('success'),
        });
    } else {
      this.status.set('failure');
    }
  }

  protected backToMethods(): void {
    this.router.navigate(['/profile/payment']);
  }
}
