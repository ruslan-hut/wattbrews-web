import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ValidationUtils } from '../../../shared/utils/validation.utils';

@Component({
  selector: 'app-register',
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
    MatSnackBarModule,
    MatCheckboxModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title class="register-title">
            <mat-icon class="register-icon">ev_station</mat-icon>
            Create Account
          </mat-card-title>
          <mat-card-subtitle>Join WattBrews and start charging</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <div class="name-fields">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="Enter your first name">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Enter your last name">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Create a password">
              <button mat-icon-button matSuffix type="button" (click)="togglePasswordVisibility()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 8 characters
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('passwordStrength')">
                Password must contain uppercase, lowercase, number and special character
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirm your password">
              <button mat-icon-button matSuffix type="button" (click)="toggleConfirmPasswordVisibility()">
                <mat-icon>{{hideConfirmPassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div class="terms-checkbox">
              <mat-checkbox formControlName="acceptTerms" class="terms-checkbox-input">
                I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>
              </mat-checkbox>
              <mat-error *ngIf="registerForm.get('acceptTerms')?.hasError('required')" class="terms-error">
                You must accept the terms and conditions
              </mat-error>
            </div>

            <button mat-raised-button color="primary" type="submit" class="register-button" [disabled]="registerForm.invalid || isLoading()">
              <mat-spinner *ngIf="isLoading()" diameter="20" class="button-spinner"></mat-spinner>
              <span *ngIf="!isLoading()">Create Account</span>
            </button>

            <div class="divider">
              <span>or</span>
            </div>

            <button mat-stroked-button type="button" class="google-button" (click)="signUpWithGoogle()" [disabled]="isLoading()">
              <mat-icon>login</mat-icon>
              Continue with Google
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="register-actions">
          <p>Already have an account? <a routerLink="/auth/login" class="login-link">Sign in</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .register-card {
      width: 100%;
      max-width: 500px;
      padding: 0;
    }

    .register-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }

    .register-icon {
      color: #2196f3;
      font-size: 2rem;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .name-fields {
      display: flex;
      gap: 16px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    .terms-checkbox {
      margin: 8px 0;
    }

    .terms-checkbox-input {
      font-size: 0.9rem;
    }

    .terms-link {
      color: #2196f3;
      text-decoration: none;
    }

    .terms-link:hover {
      text-decoration: underline;
    }

    .terms-error {
      font-size: 0.75rem;
      color: #f44336;
      margin-top: 4px;
    }

    .register-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      margin-top: 8px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    .divider {
      text-align: center;
      margin: 20px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      color: #666;
      font-size: 0.9rem;
    }

    .google-button {
      width: 100%;
      height: 48px;
      font-size: 1rem;
    }

    .register-actions {
      text-align: center;
      padding: 20px;
      margin: 0;
    }

    .login-link {
      color: #2196f3;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .register-container {
        padding: 10px;
      }
      
      .register-card {
        margin: 0;
      }

      .name-fields {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);
  protected readonly isLoading = this.authService.isLoading;

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: this.passwordMatchValidator });

  passwordStrengthValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const validation = ValidationUtils.validatePassword(control.value);
    return validation.isValid ? null : { passwordStrength: true };
  }

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update(hide => !hide);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update(hide => !hide);
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid) {
      try {
        const { firstName, lastName, email, password } = this.registerForm.value;
        await this.authService.register({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
          firstName,
          lastName
        });
        this.notificationService.success('Account created successfully!', 'Welcome to WattBrews');
      } catch (error: any) {
        this.notificationService.error(error.message || 'Registration failed. Please try again.');
      }
    }
  }

  async signUpWithGoogle(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      this.notificationService.success('Account created successfully!', 'Google Sign-up Successful');
    } catch (error: any) {
      this.notificationService.error(error.message || 'Google sign-up failed. Please try again.');
    }
  }
}
