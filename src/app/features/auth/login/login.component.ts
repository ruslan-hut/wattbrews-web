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
            <button mat-raised-button color="primary" type="button" class="google-button primary" (click)="signInWithGoogle()" [disabled]="isLoading()">
              <mat-icon class="google-icon">login</mat-icon>
              <span *ngIf="!isLoading()">Continue with Google</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
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

              <button mat-raised-button color="accent" type="submit" class="email-login-button" [disabled]="loginForm.invalid || isLoading()">
                <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
                <span *ngIf="!isLoading()">Sign In with Email</span>
              </button>
            </form>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      min-height: 100vh !important;
      padding: 40px 20px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }

    .login-card {
      width: 100% !important;
      max-width: 450px !important;
      padding: 0 !important;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
      border-radius: 20px !important;
      margin: 0 auto !important;
    }

    .login-card mat-card-header {
      text-align: center !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 24px 20px 16px 20px !important;
    }

    .login-title {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      font-size: 2.2rem !important;
      font-weight: 600 !important;
      color: #333 !important;
      margin-bottom: 8px !important;
      padding: 0 !important;
      text-align: center !important;
    }

    .login-icon {
      color: #2196f3 !important;
      font-size: 1.8rem !important;
      flex-shrink: 0 !important;
    }

    mat-card-subtitle {
      text-align: center !important;
      margin: 0 !important;
      color: #666 !important;
      font-size: 1rem !important;
    }

    .login-explanation {
      margin-bottom: 24px !important;
      text-align: center !important;
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
    }

    .explanation-text {
      color: #666 !important;
      font-size: 0.95rem !important;
      line-height: 1.5 !important;
      margin: 0 !important;
      padding: 0 20px !important;
      text-align: center !important;
      max-width: 400px !important;
    }

    .primary-login {
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
      margin-bottom: 32px !important;
    }

    .google-button.primary {
      width: 100% !important;
      height: 64px !important;
      font-size: 1.2rem !important;
      font-weight: 600 !important;
      background: #4285f4 !important;
      color: white !important;
      border: none !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3) !important;
    }

    .google-button.primary:hover {
      background: #3367d6 !important;
      box-shadow: 0 6px 16px rgba(66, 133, 244, 0.4) !important;
    }

    .google-icon {
      margin-right: 16px !important;
      font-size: 1.4rem !important;
    }

    .secondary-login {
      transition: all 0.3s ease !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      width: 100% !important;
    }

    .toggle-email-button {
      width: 100% !important;
      height: 56px !important;
      font-size: 1.1rem !important;
      font-weight: 500 !important;
      margin-bottom: 24px !important;
      border-radius: 12px !important;
    }

    .login-form {
      display: flex !important;
      flex-direction: column !important;
      gap: 24px !important;
      margin-top: 24px !important;
      padding: 32px !important;
      background: #f8f9fa !important;
      border-radius: 16px !important;
      border: 1px solid #e9ecef !important;
      width: 100% !important;
      max-width: 400px !important;
    }

    .full-width {
      width: 100% !important;
    }

    .forgot-password {
      text-align: right !important;
      margin-top: -8px !important;
    }

    .forgot-link {
      color: #2196f3 !important;
      text-decoration: none !important;
      font-size: 0.95rem !important;
      font-weight: 500 !important;
    }

    .forgot-link:hover {
      text-decoration: underline !important;
    }

    .email-login-button {
      width: 100% !important;
      height: 56px !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      margin-top: 16px !important;
      border-radius: 12px !important;
    }

    .button-spinner {
      margin-right: 12px !important;
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 20px 16px !important;
      }
      
      .login-card {
        margin: 0 !important;
      }

      .login-title {
        font-size: 1.8rem !important;
        gap: 16px !important;
        padding: 0 16px !important;
      }

      .login-icon {
        font-size: 1.5rem !important;
      }

      .login-form {
        padding: 24px !important;
        max-width: 100% !important;
      }

      .explanation-text {
        padding: 0 12px !important;
        font-size: 0.9rem !important;
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
