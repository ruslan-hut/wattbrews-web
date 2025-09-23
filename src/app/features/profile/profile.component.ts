import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { UserInfoService } from '../../core/services/user-info.service';
import { AuthService } from '../../core/services/auth.service';
import { UserInfo, PaymentPlan, UserTag, UserPaymentMethod } from '../../core/models/user-info.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
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
  template: `
    <div class="profile-container">
      <h1 class="profile-title">User Profile</h1>
      
      <!-- Authentication Loading State -->
      <div class="loading-container" *ngIf="isAuthLoading()">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Checking authentication...</p>
      </div>
      
      <!-- Authentication Required Message -->
      <div class="auth-required-message" *ngIf="!isAuthLoading() && !isAuthenticated()">
        <mat-icon class="auth-icon">lock</mat-icon>
        <h3>Authentication Required</h3>
        <p>You need to be logged in to view your profile. Please sign in to continue.</p>
        <button mat-raised-button color="primary" (click)="navigateToLogin()">
          <mat-icon>login</mat-icon>
          Sign In
        </button>
      </div>
      
      <!-- User Info Loading State -->
      <div class="loading-container" *ngIf="isAuthenticated() && userInfoService.loading()">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading user information...</p>
      </div>
      
      <!-- Error State -->
      <div class="error-container" *ngIf="!isAuthLoading() && isAuthenticated() && userInfoService.error()">
        <mat-icon class="error-icon">error</mat-icon>
        <p>{{ userInfoService.error() }}</p>
        <button mat-button color="primary" (click)="refreshUserInfo()">
          Retry
        </button>
      </div>
      
      <!-- Profile Content -->
      <div class="profile-content" *ngIf="!isAuthLoading() && isAuthenticated() && !userInfoService.loading() && !userInfoService.error() && userInfoService.userInfo()">
        <!-- User Basic Info -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Basic Information
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="user-info-grid">
              <div class="info-item">
                <label>Username</label>
                <span>{{ userInfoService.userInfo()?.username }}</span>
              </div>
              <div class="info-item">
                <label>Name</label>
                <span>{{ userInfoService.userInfo()?.name }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ userInfoService.userInfo()?.email || 'Not provided' }}</span>
              </div>
              <div class="info-item">
                <label>Role</label>
                <mat-chip [class.admin]="userInfoService.isAdmin()" [class.user]="!userInfoService.isAdmin()">
                  {{ userInfoService.getUserRole() }}
                </mat-chip>
              </div>
              <div class="info-item">
                <label>Access Level</label>
                <span>{{ userInfoService.getAccessLevel() }}</span>
              </div>
              <div class="info-item">
                <label>Registration Date</label>
                <span>{{ formatDate(userInfoService.getRegistrationDate()) }}</span>
              </div>
              <div class="info-item">
                <label>Last Seen</label>
                <span>{{ formatDate(userInfoService.getLastSeenDate()) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Tabs for detailed information -->
        <mat-tab-group class="profile-tabs">
          <!-- Payment Plans Tab -->
          <mat-tab label="Payment Plans">
            <div class="tab-content">
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>payment</mat-icon>
                    Tariff Plans
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="payment-plans" *ngIf="userInfoService.getPaymentPlans().length > 0; else noPlans">
                    <div class="plan-item" *ngFor="let plan of userInfoService.getPaymentPlans()">
                      <div class="plan-header">
                        <h3>{{ plan.description }}</h3>
                        <div class="plan-badges">
                          <mat-chip *ngIf="plan.is_default" color="primary">Default</mat-chip>
                          <mat-chip *ngIf="plan.is_active" color="accent">Active</mat-chip>
                        </div>
                      </div>
                      <div class="plan-details">
                        <div class="price-item">
                          <mat-icon>flash_on</mat-icon>
                          <span>{{ plan.price_per_kwh }} €/kWh</span>
                        </div>
                        <div class="price-item">
                          <mat-icon>schedule</mat-icon>
                          <span>{{ plan.price_per_hour }} €/hour</span>
                        </div>
                        <div class="price-item" *ngIf="plan.start_time">
                          <mat-icon>schedule</mat-icon>
                          <span>Start: {{ formatTime(plan.start_time) }}</span>
                        </div>
                        <div class="price-item" *ngIf="plan.end_time">
                          <mat-icon>schedule</mat-icon>
                          <span>End: {{ formatTime(plan.end_time) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noPlans>
                    <div class="empty-state">
                      <mat-icon>payment</mat-icon>
                      <p>No payment plans available</p>
                    </div>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- User Tags Tab -->
          <mat-tab label="User Tags">
            <div class="tab-content">
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>credit_card</mat-icon>
                    Registered Tags
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="user-tags" *ngIf="userInfoService.getUserTags().length > 0; else noTags">
                    <div class="tag-item" *ngFor="let tag of userInfoService.getUserTags()">
                      <div class="tag-header">
                        <h3>{{ tag.id_tag }}</h3>
                        <div class="tag-badges">
                          <mat-chip *ngIf="tag.is_enabled" color="accent">Enabled</mat-chip>
                          <mat-chip *ngIf="tag.local" color="primary">Local</mat-chip>
                        </div>
                      </div>
                      <div class="tag-details">
                        <div class="tag-info">
                          <span class="label">Note:</span>
                          <span>{{ tag.note || 'No note' }}</span>
                        </div>
                        <div class="tag-info">
                          <span class="label">Last Seen:</span>
                          <span>{{ formatDate(getDateFromString(tag.last_seen)) }}</span>
                        </div>
                        <div class="tag-info">
                          <span class="label">Registered:</span>
                          <span>{{ formatDate(getDateFromString(tag.date_registered)) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noTags>
                    <div class="empty-state">
                      <mat-icon>credit_card</mat-icon>
                      <p>No user tags registered</p>
                    </div>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Payment Methods Tab -->
          <mat-tab label="Payment Methods">
            <div class="tab-content">
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>account_balance_wallet</mat-icon>
                    Payment Methods
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="payment-methods" *ngIf="userInfoService.getPaymentMethods().length > 0; else noMethods">
                    <div class="method-item" *ngFor="let method of userInfoService.getPaymentMethods()">
                      <div class="method-header">
                        <div class="method-info">
                          <h3>{{ method.description }}</h3>
                          <p>{{ userInfoService.getCardBrandName(method.card_brand) }} •••• {{ method.identifier.slice(-4) }}</p>
                        </div>
                        <div class="method-badges">
                          <mat-chip *ngIf="method.is_default" color="primary">Default</mat-chip>
                          <mat-chip *ngIf="method.fail_count > 0" color="warn">
                            <mat-icon>warning</mat-icon>
                            {{ method.fail_count }} failures
                          </mat-chip>
                        </div>
                      </div>
                      <div class="method-details">
                        <div class="method-info-item">
                          <span class="label">Country:</span>
                          <span>{{ userInfoService.getCountryName(method.card_country) }}</span>
                        </div>
                        <div class="method-info-item">
                          <span class="label">Expires:</span>
                          <span>{{ userInfoService.formatExpiryDate(method.expiry_date) }}</span>
                        </div>
                        <div class="method-info-item">
                          <span class="label">Merchant ID:</span>
                          <span>{{ method.merchant_cof_txnid }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noMethods>
                    <div class="empty-state">
                      <mat-icon>account_balance_wallet</mat-icon>
                      <p>No payment methods registered</p>
                    </div>
                  </ng-template>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .profile-title {
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 2rem;
      color: #2c3e50;
      text-align: center;
    }

    .auth-required-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .auth-icon {
      font-size: 1.5rem;
      color: #6c757d;
    }

    .auth-required-message h3 {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
    }

    .auth-required-message p {
      margin: 0;
      color: #6c757d;
      font-size: 1rem;
      line-height: 1.5;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      text-align: center;
    }
    
    .error-icon {
      color: #f44336;
      font-size: 3rem;
    }
    
    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .profile-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
      border: 1px solid #dadce0;
    }
    
    .user-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-item label {
      font-weight: 500;
      color: #5a6c7d;
      font-size: 0.9rem;
    }
    
    .info-item span {
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .mat-chip.admin {
      background-color: #f44336;
      color: white;
    }
    
    .mat-chip.user {
      background-color: #2196f3;
      color: white;
    }
    
    .profile-tabs {
      margin-top: 24px;
    }
    
    .tab-content {
      padding: 24px 0;
    }
    
    .section-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #ced4da;
    }
    
    .payment-plans {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .plan-item {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .plan-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }
    
    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .plan-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .plan-badges {
      display: flex;
      gap: 8px;
    }
    
    .plan-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .price-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .price-item mat-icon {
      color: #5a6c7d;
    }
    
    .user-tags {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .tag-item {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .tag-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }
    
    .tag-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .tag-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
      font-family: monospace;
      color: #2c3e50;
    }
    
    .tag-badges {
      display: flex;
      gap: 8px;
    }
    
    .tag-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .tag-info {
      display: flex;
      gap: 8px;
    }
    
    .tag-info .label {
      font-weight: 500;
      color: #5a6c7d;
      min-width: 80px;
    }
    
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .method-item {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.8);
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .method-item:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #ced4da;
    }
    
    .method-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .method-info h3 {
      margin: 0 0 4px 0;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .method-info p {
      margin: 0;
      color: #5a6c7d;
      font-size: 0.9rem;
    }
    
    .method-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .method-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    
    .method-info-item {
      display: flex;
      gap: 8px;
    }
    
    .method-info-item .label {
      font-weight: 500;
      color: #5a6c7d;
      min-width: 80px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px;
      text-align: center;
      color: #5a6c7d;
    }
    
    .empty-state mat-icon {
      font-size: 3rem;
      color: #adb5bd;
    }
    
    @media (max-width: 768px) {
      .profile-container {
        padding: 10px;
      }
      
      .profile-title {
        font-size: 2rem;
      }
      
      .user-info-grid {
        grid-template-columns: 1fr;
      }
      
      .plan-details {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .method-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  protected readonly userInfoService = inject(UserInfoService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  // Authentication state
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly isAuthLoading = this.authService.isLoading;
  
  // Subscription management
  private authSubscription?: Subscription;

  ngOnInit(): void {
    console.log('ProfileComponent initialized');
    console.log('Current user from auth service:', this.authService.user());
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('Is auth loading:', this.isAuthLoading());
    
    // Subscribe to auth state changes to handle race conditions
    this.authSubscription = this.authService.user$.subscribe(user => {
      console.log('Auth state changed in profile component:', user ? 'User logged in' : 'User logged out');
      
      if (user && this.isAuthenticated()) {
        console.log('User authenticated, loading profile data');
        this.loadUserInfo();
      } else if (!user) {
        console.log('User not authenticated, clearing profile data');
        this.userInfoService.clearData();
      }
    });
    
    // Also check immediately in case auth is already resolved
    if (this.isAuthenticated()) {
      console.log('User already authenticated, loading profile data immediately');
      this.loadUserInfo();
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
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
      console.warn('Error formatting time:', timeString, error);
      return timeString;
    }
  }

  private loadUserInfo(): void {
    console.log('Loading current user info using /users/info/0000 endpoint');
    
    this.userInfoService.loadCurrentUserInfo().subscribe({
      next: (userInfo) => {
        console.log('Current user info loaded successfully:', userInfo);
      },
      error: (error) => {
        console.error('Error loading current user info:', error);
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
