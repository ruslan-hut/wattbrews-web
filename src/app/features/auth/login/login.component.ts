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
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title class="login-title">
            <mat-icon class="login-icon">ev_station</mat-icon>
            <span>WattBrews</span>
          </mat-card-title>
          <mat-card-subtitle>Access your charging station management</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Explanation Text -->
          <div class="login-explanation">
            <p class="explanation-text">
              You can sign in using your Google account or email address. 
              If you don't have an account yet, we'll create one for you automatically.
            </p>
          </div>

          <!-- Primary: Google Sign In -->
          <div class="primary-login">
            <button mat-raised-button type="button" class="energy-button-primary" (click)="signInWithGoogle()" [disabled]="isLoading()">
              <mat-icon class="energy-m-sm">login</mat-icon>
              <span *ngIf="!isLoading()">Continue with Google</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="energy-m-sm"></mat-spinner>
            </button>
          </div>

          <!-- Secondary: Email/Password -->
          <div class="secondary-login" [class.expanded]="showEmailLogin()">
            <button mat-stroked-button type="button" class="toggle-email-button" (click)="toggleEmailLogin()" [disabled]="isLoading()">
              <mat-icon>email</mat-icon>
              Sign in with Email
            </button>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" *ngIf="showEmailLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="Enter your email">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter your password">
                <button mat-icon-button matSuffix type="button" (click)="togglePasswordVisibility()">
                  <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
              </mat-form-field>

              <div class="forgot-password">
                <a routerLink="/auth/forgot-password" class="forgot-link">
                  Forgot your password?
                </a>
              </div>

              <button mat-raised-button type="submit" class="energy-button-secondary" [disabled]="loginForm.invalid || isLoading()">
                <mat-spinner *ngIf="isLoading()" diameter="20" class="energy-m-sm"></mat-spinner>
                <span *ngIf="!isLoading()">Sign In with Email</span>
              </button>
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

    .forgot-password {
      text-align: right;
      margin-top: calc(-1 * var(--energy-space-sm));
    }

    .forgot-link {
      color: var(--energy-cyan);
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .forgot-link:hover {
      color: var(--energy-cyan-dark);
      text-decoration: underline;
    }

    // Responsive adjustments
    @media (max-width: 480px) {
      .login-form {
        padding: var(--energy-space-lg);
        max-width: 100%;
      }
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly hidePassword = signal(true);
  protected readonly showEmailLogin = signal(false);
  protected readonly isLoading = this.authService.isLoading;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }

  toggleEmailLogin(): void {
    this.showEmailLogin.update(show => !show);
  }

  async signInWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.notificationService.success('Welcome back!', 'Google Sign-in Successful');
    } catch (error: any) {
      this.notificationService.error(error.message || 'Google sign-in failed. Please try again.');
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login({ email, password });
        this.notificationService.success('Welcome back!', 'Email Login Successful');
      } catch (error: any) {
        this.notificationService.error(error.message || 'Login failed. Please try again.');
      }
    }
  }
}
