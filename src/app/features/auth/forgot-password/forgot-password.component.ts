import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-card-title class="forgot-password-title">
            <mat-icon class="forgot-password-icon">lock_reset</mat-icon>
            Reset Password
          </mat-card-title>
          <mat-card-subtitle>Enter your email to receive reset instructions</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="forgot-password-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email address">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="reset-button" [disabled]="forgotPasswordForm.invalid || isLoading()">
              <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
              <span *ngIf="!isLoading()">Send Reset Email</span>
            </button>
          </form>

          <div *ngIf="emailSent()" class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <p>Password reset email sent! Check your inbox and follow the instructions.</p>
            <p class="resend-text">
              Didn't receive the email? 
              <a href="#" (click)="resendEmail()" class="resend-link">Resend</a>
            </p>
          </div>
        </mat-card-content>

        <mat-card-actions class="forgot-password-actions">
          <p>Remember your password? <a routerLink="/auth/login" class="login-link">Sign in</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: var(--energy-gradient-hero);
    }

    .forgot-password-card {
      width: 100%;
      max-width: 400px;
      padding: 0;
      background-color: var(--energy-surface);
      border-radius: var(--energy-radius-xl);
    }

    .forgot-password-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--energy-text-primary);
    }

    .forgot-password-icon {
      color: var(--energy-secondary);
      font-size: 2rem;
    }

    .forgot-password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
    }

    .reset-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      margin-top: 8px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    .success-message {
      text-align: center;
      padding: 20px;
      background: var(--energy-primary-50);
      border-radius: var(--energy-radius-lg);
      margin-top: 20px;
    }

    .success-icon {
      color: var(--energy-success);
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .success-message p {
      margin: 8px 0;
      color: var(--energy-text-primary);
    }

    .resend-text {
      font-size: 0.9rem;
      color: var(--energy-text-secondary);
    }

    .resend-link {
      color: var(--energy-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .resend-link:hover {
      text-decoration: underline;
    }

    .forgot-password-actions {
      text-align: center;
      padding: 20px;
      margin: 0;
    }

    .forgot-password-actions p {
      color: var(--energy-text-secondary);
    }

    .login-link {
      color: var(--energy-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .forgot-password-container {
        padding: 10px;
      }

      .forgot-password-card {
        margin: 0;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly emailSent = signal(false);

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.valid) {
      try {
        const { email } = this.forgotPasswordForm.value;
        await this.authService.resetPassword(email);
        this.emailSent.set(true);
        this.notificationService.success('Password reset email sent!', 'Check your inbox');
      } catch (error: any) {
        this.notificationService.error(error.message || 'Failed to send reset email. Please try again.');
      }
    }
  }

  async resendEmail(): Promise<void> {
    if (this.forgotPasswordForm.valid) {
      try {
        const { email } = this.forgotPasswordForm.value;
        await this.authService.resetPassword(email);
        this.notificationService.info('Reset email sent again!');
      } catch (error: any) {
        this.notificationService.error(error.message || 'Failed to resend email.');
      }
    }
  }
}
