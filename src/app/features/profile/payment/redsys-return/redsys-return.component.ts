import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';
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
 *
 * Because this page is the entry point of a *fresh* page load (the
 * browser was on sis.redsys.es until the redirect), we cannot call the
 * backend from ngOnInit directly — Firebase Auth is still restoring
 * its session from IndexedDB, and the HTTP interceptor would send an
 * unauthenticated request → 401. Instead we subscribe to
 * `authService.user$` in the constructor (injection context) and
 * trigger the refresh as soon as a non-null user emerges. Same
 * approach `ProfileComponent` uses.
 */
type ReturnStatus = 'loading' | 'success' | 'failure';

@Component({
  selector: 'app-redsys-return',
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
  private readonly authService = inject(AuthService);
  private readonly userInfoService = inject(UserInfoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly translationService = inject(SimpleTranslationService);

  protected readonly status = signal<ReturnStatus>('loading');

  constructor() {
    // Subscribe to auth state in the constructor (injection context).
    // When Firebase finishes restoring the session we get a non-null
    // user, and only then can we safely call the backend.
    this.authService.user$
      .pipe(
        filter((user) => user !== null),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.handleAuthReady());
  }

  ngOnInit(): void {
    // If the query param says KO we can resolve the UI immediately —
    // no backend call needed, so no auth race to worry about.
    const result = this.route.snapshot.queryParamMap.get('result');
    if (result !== 'ok') {
      this.status.set('failure');
    }
  }

  private handleAuthReady(): void {
    // Only the OK path refreshes the methods list. The KO path was
    // already resolved in ngOnInit.
    const result = this.route.snapshot.queryParamMap.get('result');
    if (result !== 'ok') {
      return;
    }
    this.userInfoService
      .loadCurrentUserInfo({ include_payment_methods: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.status.set('success'),
        // A refresh failure doesn't invalidate the tokenization; the
        // card is persisted server-side regardless. Show success anyway.
        error: () => this.status.set('success'),
      });
  }

  protected backToMethods(): void {
    this.router.navigate(['/profile/payment']);
  }
}
