import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-verify-email-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
],
  template: `
    <div class="verify-container">
      <mat-card class="verify-card">
        <mat-card-header>
          <mat-card-title class="verify-title">
            <mat-icon class="verify-icon">email</mat-icon>
            <span>Complete Sign-in</span>
          </mat-card-title>
          <mat-card-subtitle>Verify your email to complete the sign-in process</mat-card-subtitle>
        </mat-card-header>
    
        <mat-card-content>
          <!-- Loading State -->
          @if (isLoading()) {
            <div class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
              <p class="loading-text">Verifying your sign-in link...</p>
            </div>
          }
    
          <!-- Email Input Form -->
          @if (!isLoading() && !isVerifying()) {
            <form [formGroup]="emailForm" (ngSubmit)="onSubmit()" class="verify-form">
              <div class="explanation">
                <p class="explanation-text">
                  Please enter your email address to complete the sign-in process.
                </p>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter your email address">
                <mat-icon matSuffix>email</mat-icon>
                @if (emailForm.get('email')?.hasError('required')) {
                  <mat-error>
                    Email is required
                  </mat-error>
                }
                @if (emailForm.get('email')?.hasError('email')) {
                  <mat-error>
                    Please enter a valid email
                  </mat-error>
                }
              </mat-form-field>
              <button mat-raised-button type="submit" class="energy-button-primary" [disabled]="emailForm.invalid || isVerifying()">
                @if (isVerifying()) {
                  <mat-spinner diameter="20" class="energy-m-sm"></mat-spinner>
                }
                @if (!isVerifying()) {
                  <span>Complete Sign-in</span>
                }
              </button>
            </form>
          }
    
          <!-- Verifying State -->
          @if (isVerifying()) {
            <div class="verifying-state">
              <mat-spinner diameter="40"></mat-spinner>
              <p class="verifying-text">Completing sign-in...</p>
            </div>
          }
    
          <!-- Success State -->
          @if (isSuccess()) {
            <div class="success-state">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <p class="success-text">Sign-in successful!</p>
              <p class="success-subtext">Redirecting to dashboard...</p>
            </div>
          }
    
          <!-- Error State -->
          @if (hasError()) {
            <div class="error-state">
              <mat-icon class="error-icon">error</mat-icon>
              <p class="error-text">{{ errorMessage() }}</p>
              <button mat-raised-button class="energy-button-secondary" (click)="goToLogin()">
                Back to Login
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
    `,
  styles: [`
    .verify-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: var(--energy-space-lg);
      background: linear-gradient(135deg, var(--energy-blue-50) 0%, var(--energy-cyan-50) 100%);
    }

    .verify-card {
      width: 100%;
      max-width: 500px;
      box-shadow: var(--energy-shadow-xl);
      border-radius: var(--energy-radius-2xl);
    }

    .verify-title {
      display: flex;
      align-items: center;
      gap: var(--energy-space-sm);
      color: var(--energy-blue-dark);
    }

    .verify-icon {
      color: var(--energy-blue);
      font-size: 1.5rem;
    }

    .verify-form {
      display: flex;
      flex-direction: column;
      gap: var(--energy-space-lg);
      padding: var(--energy-space-xl);
    }

    .explanation {
      padding: var(--energy-space-md);
      background: var(--energy-blue-50);
      border-radius: var(--energy-radius-lg);
      border-left: 4px solid var(--energy-blue);
    }

    .explanation-text {
      margin: 0;
      color: var(--energy-blue-dark);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .full-width {
      width: 100%;
    }

    .loading-state,
    .verifying-state,
    .success-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--energy-space-lg);
      padding: var(--energy-space-2xl);
      text-align: center;
    }

    .loading-text,
    .verifying-text {
      margin: 0;
      color: var(--energy-gray-600);
      font-size: 1rem;
    }

    .success-icon {
      color: var(--energy-green);
      font-size: 3rem;
    }

    .success-text {
      margin: 0;
      color: var(--energy-green-dark);
      font-size: 1.2rem;
      font-weight: 500;
    }

    .success-subtext {
      margin: 0;
      color: var(--energy-gray-600);
      font-size: 0.9rem;
    }

    .error-icon {
      color: var(--energy-red);
      font-size: 3rem;
    }

    .error-text {
      margin: 0;
      color: var(--energy-red-dark);
      font-size: 1rem;
    }

    // Responsive adjustments
    @media (max-width: 480px) {
      .verify-container {
        padding: var(--energy-space-md);
      }

      .verify-form {
        padding: var(--energy-space-lg);
      }
    }
  `]
})
export class VerifyEmailLinkComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = signal(true);
  protected readonly isVerifying = signal(false);
  protected readonly isSuccess = signal(false);
  protected readonly hasError = signal(false);
  protected readonly errorMessage = signal('');

  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.checkForEmailLink();
  }

  private async checkForEmailLink(): Promise<void> {
    try {
      const currentUrl = window.location.href;
      
      if (this.authService.isSignInWithEmailLink(currentUrl)) {
        // Check if we have a stored email
        const storedEmail = this.authService.getStoredEmailForSignIn();
        
        if (storedEmail) {
          // Pre-fill the form with stored email
          this.emailForm.patchValue({ email: storedEmail });
          // Automatically complete sign-in
          await this.completeSignIn(storedEmail, currentUrl);
        } else {
          // Show email input form
          this.isLoading.set(false);
        }
      } else {
        // Not a valid email link, redirect to login
        this.hasError.set(true);
        this.errorMessage.set('Invalid or expired sign-in link.');
        this.isLoading.set(false);
      }
    } catch (error: any) {
      this.hasError.set(true);
      this.errorMessage.set(error.message || 'An error occurred while verifying the link.');
      this.isLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.emailForm.valid) {
      const { email } = this.emailForm.value;
      const currentUrl = window.location.href;
      await this.completeSignIn(email, currentUrl);
    }
  }

  private async completeSignIn(email: string, url: string): Promise<void> {
    try {
      this.isVerifying.set(true);
      
      await this.authService.signInWithEmailLink(email, url);
      
      this.isSuccess.set(true);
      this.notificationService.success('Welcome!', 'Email link sign-in successful');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 2000);
      
    } catch (error: any) {
      this.hasError.set(true);
      this.errorMessage.set(error.message || 'Failed to complete sign-in. Please try again.');
      this.isVerifying.set(false);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
