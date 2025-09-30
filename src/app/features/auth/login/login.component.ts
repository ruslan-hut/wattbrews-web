import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title class="login-title">
            <mat-icon class="login-icon">ev_station</mat-icon>
            <span>{{ translationService.getReactive('pages.auth.login.title') }}</span>
          </mat-card-title>
          <mat-card-subtitle>{{ translationService.getReactive('pages.auth.login.subtitle') }}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Explanation Text -->
          <div class="login-explanation">
            <p class="explanation-text">
              {{ translationService.getReactive('pages.auth.login.explanation') }}
            </p>
          </div>

          <!-- Sign-in Options -->
          <div class="sign-in-options">
            <button mat-raised-button type="button" class="sign-in-button google-button" (click)="signInWithGoogle()" [disabled]="isLoading()">
              <mat-icon class="button-icon">login</mat-icon>
              <span *ngIf="!isLoading()">{{ translationService.getReactive('pages.auth.login.continueWithGoogle') }}</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
            </button>

            <button mat-raised-button type="button" class="sign-in-button email-link-button" (click)="toggleEmailLinkForm()" [disabled]="isLoading()">
              <mat-icon class="button-icon">link</mat-icon>
              <span *ngIf="!isLoading()">{{ translationService.getReactive('pages.auth.login.signInWithEmailLink') }}</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
            </button>
          </div>

          <!-- Email Link Form -->
          <div class="email-link-form-container" [class.expanded]="showEmailLinkForm()">

            <!-- Email Link Form -->
            <form [formGroup]="emailLinkForm" (ngSubmit)="onEmailLinkSubmit()" class="login-form" *ngIf="showEmailLinkForm()">
              <div class="email-link-explanation">
                <p class="explanation-text">
                  {{ translationService.getReactive('pages.auth.login.emailLinkExplanation') }}
                </p>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter your email address">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="emailLinkForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="emailLinkForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <button mat-raised-button type="submit" class="energy-button-secondary" [disabled]="emailLinkForm.invalid || isLoading()">
                <mat-spinner *ngIf="isLoading()" diameter="20" class="energy-m-sm"></mat-spinner>
                <span *ngIf="!isLoading()">{{ translationService.getReactive('pages.auth.login.sendSignInLink') }}</span>
              </button>

              <!-- Success Message -->
              <div class="email-link-success" *ngIf="emailLinkSent()">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <p class="success-message">
                  {{ translationService.getReactive('pages.auth.login.signInLinkSent') }}
                </p>
                <p class="success-submessage">
                  {{ translationService.getReactive('pages.auth.login.checkSpamFolder') }}
                </p>
              </div>
            </form>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    // Minimal component-specific styles - most styling handled by global energy theme
    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--energy-space-lg);
      margin-top: var(--energy-space-lg);
      padding: var(--energy-space-xl);
      background: var(--energy-gray-100);
      border-radius: var(--energy-radius-xl);
      border: 1px solid var(--energy-gray-200);
      width: 100%;
      max-width: 400px;
    }

    .full-width {
      width: 100%;
    }

    .sign-in-options {
      display: flex;
      flex-direction: column;
      gap: var(--energy-space-md);
      margin-bottom: var(--energy-space-lg);
    }

    .sign-in-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      border-radius: var(--energy-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--energy-space-sm);
      transition: all 0.2s ease;
    }

    .google-button {
      background: #4285f4;
      color: white;
      border: none;
    }

    .google-button:hover:not(:disabled) {
      background: #3367d6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
    }

    .email-link-button {
      background: var(--energy-blue);
      color: white;
      border: none;
    }

    .email-link-button:hover:not(:disabled) {
      background: var(--energy-blue-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .button-icon {
      font-size: 1.2rem;
    }

    .button-spinner {
      margin: 0;
    }

    .email-link-form-container {
      margin-top: var(--energy-space-lg);
    }

    .email-link-explanation {
      margin-bottom: var(--energy-space-lg);
      padding: var(--energy-space-md);
      background: var(--energy-blue-50);
      border-radius: var(--energy-radius-lg);
      border-left: 4px solid var(--energy-blue);
    }

    .email-link-explanation .explanation-text {
      margin: 0;
      color: var(--energy-blue-dark);
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .email-link-success {
      margin-top: var(--energy-space-lg);
      padding: var(--energy-space-lg);
      background: var(--energy-green-50);
      border-radius: var(--energy-radius-lg);
      border: 1px solid var(--energy-green-200);
      text-align: center;
    }

    .success-icon {
      color: var(--energy-green);
      font-size: 2rem;
      margin-bottom: var(--energy-space-sm);
    }

    .success-message {
      margin: 0 0 var(--energy-space-sm) 0;
      color: var(--energy-green-dark);
      font-weight: 500;
    }

    .success-submessage {
      margin: 0;
      color: var(--energy-gray-600);
      font-size: 0.9rem;
    }

    // Responsive adjustments
    @media (max-width: 480px) {
      .login-form {
        padding: var(--energy-space-lg);
        max-width: 100%;
      }

      .sign-in-options {
        gap: var(--energy-space-sm);
      }

      .sign-in-button {
        height: 44px;
        font-size: 0.95rem;
      }
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly showEmailLinkForm = signal(false);
  protected readonly emailLinkSent = signal(false);
  protected readonly isLoading = this.authService.isLoading;

  emailLinkForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  toggleEmailLinkForm(): void {
    this.showEmailLinkForm.update(show => !show);
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.notificationService.success('Welcome back!', 'Google Sign-in Successful');
    } catch (error: any) {
      this.notificationService.error(error.message || 'Google sign-in failed. Please try again.');
    }
  }

  async onEmailLinkSubmit(): Promise<void> {
    if (this.emailLinkForm.valid) {
      try {
        const { email } = this.emailLinkForm.value;
        await this.authService.sendSignInLinkToEmail(email);
        this.emailLinkSent.set(true);
        this.notificationService.success('Sign-in link sent!', 'Check your email and click the link to sign in.');
      } catch (error: any) {
        this.notificationService.error(error.message || 'Failed to send sign-in link. Please try again.');
      }
    }
  }
}
