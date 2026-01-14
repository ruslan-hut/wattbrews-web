import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInfoService } from '../../core/services/user-info.service';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo, PaymentPlan, UserTag, UserPaymentMethod } from '../../core/models/user-info.model';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  protected readonly userInfoService = inject(UserInfoService);
  protected readonly authService = inject(AuthService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly router = inject(Router);

  // Authentication state
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAuthLoading = this.authService.isLoading;
  protected readonly translationsLoading = signal(true);

  constructor() {
    // Subscribe to auth state changes to handle race conditions
    this.authService.user$
      .pipe(takeUntilDestroyed())
      .subscribe(user => {
        if (user && this.isAuthenticated()) {
          this.loadUserInfo();
        } else if (!user) {
          this.userInfoService.clearData();
        }
      });
  }

  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();

    // Also check immediately in case auth is already resolved
    if (this.isAuthenticated()) {
      this.loadUserInfo();
    }
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

  protected refreshUserInfo(): void {
    this.userInfoService.clearError();
    this.loadUserInfo();
  }

  protected formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected getDateFromString(dateString: string): Date | null {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return null;
    return new Date(dateString);
  }

  protected formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
    
    // Handle different time formats
    try {
      // If it's a time string like "09:00" or "09:00:00"
      if (timeString.includes(':')) {
        const timeParts = timeString.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        // Format as 12-hour time
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${period}`;
      }
      
      // If it's a full datetime string
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      
      return timeString;
    } catch (error) {
      return timeString;
    }
  }

  protected maskMerchantId(merchantId: string): string {
    if (!merchantId) return 'N/A';
    if (merchantId.length <= 4) return merchantId;
    return merchantId.substring(0, 4) + '****';
  }

  private loadUserInfo(): void {
    this.userInfoService.loadCurrentUserInfo().subscribe({
      next: (userInfo) => {
        // Current user info loaded successfully
      },
      error: (error) => {
        // Error loading current user info - handled by service
      }
    });
  }
  
  /**
   * Navigate to login page
   */
  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
