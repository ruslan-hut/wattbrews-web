import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
