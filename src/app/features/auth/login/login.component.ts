import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly showEmailLinkForm = signal(false);
  protected readonly emailLinkSent = signal(false);
  protected readonly translationsLoading = signal(true);
  protected readonly isLoading = this.authService.isLoading;

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }

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
