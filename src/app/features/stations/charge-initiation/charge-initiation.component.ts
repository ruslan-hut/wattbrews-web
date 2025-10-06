import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { UserInfoService } from '../../../core/services/user-info.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { StationDetail } from '../../../core/models/station-detail.model';
import { UserPaymentMethod, PaymentPlan } from '../../../core/models/user-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-charge-initiation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  template: `
    <div class="charge-initiation-container">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 class="page-title">{{ translationService.getReactive('chargeInitiation.title') }}</h1>
          <p class="page-subtitle" *ngIf="stationDetail()">{{ stationDetail()!.title }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading()">
        <app-loading-spinner></app-loading-spinner>
        <p>{{ translationService.getReactive('chargeInitiation.loadingStationDetails') }}</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error() && !loading()">
        <app-error-message [message]="error()!"></app-error-message>
        <button mat-raised-button color="primary" (click)="loadStationDetail()">
          <mat-icon>refresh</mat-icon>
          {{ translationService.getReactive('common.buttons.tryAgain') }}
        </button>
      </div>

      <!-- Charge Initiation Form -->
      <div class="charge-form" *ngIf="stationDetail() && !loading() && !error()">
        <!-- Station Info -->
        <mat-card class="station-info-card">
          <mat-card-header>
            <div mat-card-avatar class="station-status-icon">
              <mat-icon [class]="getStatusIconClass()">{{ getStatusIcon() }}</mat-icon>
            </div>
            <mat-card-title>{{ stationDetail()!.title }}</mat-card-title>
            <mat-card-subtitle>{{ stationDetail()!.address }}</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <!-- Connector Selection -->
        <mat-card class="connector-selection-card">
          <mat-card-header>
            <mat-card-title>{{ translationService.getReactive('chargeInitiation.selectConnector') }}</mat-card-title>
            <mat-card-subtitle>{{ translationService.getReactive('chargeInitiation.selectConnectorSubtitle') }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="connectors-grid">
              <div 
                *ngFor="let connector of allConnectors()" 
                class="connector-option"
                [class.selected]="selectedConnector()?.connector_id === connector.connector_id"
                [class.clickable]="connector.status === 'Available'"
                [class.not-clickable]="connector.status !== 'Available'"
                (click)="selectConnector(connector)">
                
                <div class="connector-header">
                  <h4>{{ translationService.getReactive('chargeInitiation.connector') }} {{ getConnectorDisplayName(connector) }}</h4>
                  <mat-chip [class]="getConnectorStatusClass(connector.status)">
                    {{ connector.status }}
                  </mat-chip>
                </div>
                
                <div class="connector-details">
                  <div class="connector-info">
                    <span class="connector-label">{{ translationService.getReactive('chargeInitiation.type') }}</span>
                    <span class="connector-value">{{ connector.type }}</span>
                  </div>
                  
                  <div class="connector-info">
                    <span class="connector-label">{{ translationService.getReactive('chargeInitiation.power') }}</span>
                    <span class="connector-value">{{ connector.power }} {{ translationService.getReactive('common.units.kW') }}</span>
                  </div>
                </div>
                
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Payment Method Selection -->
        <mat-card class="payment-method-card">
          <mat-card-header>
            <mat-card-title>{{ translationService.getReactive('chargeInitiation.paymentMethod') }}</mat-card-title>
            <mat-card-subtitle>{{ translationService.getReactive('chargeInitiation.paymentMethodSubtitle') }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="payment-methods-loading" *ngIf="userInfoService.loading()">
              <mat-spinner diameter="30"></mat-spinner>
              <span>{{ translationService.getReactive('chargeInitiation.loadingPaymentMethods') }}</span>
            </div>
            
            <div class="payment-methods-error" *ngIf="userInfoService.error() && !userInfoService.loading()">
              <mat-icon>error</mat-icon>
              <span>{{ translationService.getReactive('chargeInitiation.failedToLoadPaymentMethods') }} {{ userInfoService.error() }}</span>
              <button mat-button color="primary" (click)="loadUserInfo()">
                <mat-icon>refresh</mat-icon>
                {{ translationService.getReactive('common.buttons.tryAgain') }}
              </button>
            </div>
            
            <div class="payment-methods" *ngIf="!userInfoService.loading() && !userInfoService.error() && userInfoService.getPaymentMethods().length > 0; else noPaymentMethods">
              <div 
                *ngFor="let method of userInfoService.getPaymentMethods()" 
                class="payment-method-option"
                [class.selected]="selectedPaymentMethod()?.identifier === method.identifier"
                (click)="selectPaymentMethod(method)">
                
                <div class="payment-method-header">
                  <mat-icon class="payment-icon">credit_card</mat-icon>
                  <div class="payment-method-info">
                    <h4>{{ getCardBrandName(method.card_brand) }} ****{{ method.identifier.slice(-4) }}</h4>
                    <p>Expires {{ formatExpiryDate(method.expiry_date) }}</p>
                  </div>
                  <mat-icon class="check-icon" *ngIf="selectedPaymentMethod()?.identifier === method.identifier">check_circle</mat-icon>
                </div>
                
                <div class="payment-method-details">
                  <span class="payment-method-label">Country:</span>
                  <span class="payment-method-value">{{ getCountryName(method.card_country) }}</span>
                </div>
              </div>
            </div>
            
            <ng-template #noPaymentMethods>
              <div class="no-payment-methods" *ngIf="!userInfoService.loading()">
                <mat-icon>credit_card_off</mat-icon>
                <p>{{ translationService.getReactive('chargeInitiation.noPaymentMethods') }}</p>
                <button mat-raised-button color="primary" (click)="goToProfile()">
                  <mat-icon>add</mat-icon>
                  {{ translationService.getReactive('chargeInitiation.addPaymentMethod') }}
                </button>
              </div>
            </ng-template>
          </mat-card-content>
        </mat-card>

        <!-- Tariff Information -->
        <mat-card class="tariff-card">
          <mat-card-header>
            <mat-card-title>{{ translationService.getReactive('chargeInitiation.tariffInformation') }}</mat-card-title>
            <mat-card-subtitle>{{ getTariffDescription() }}</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="tariff-loading" *ngIf="userInfoService.loading()">
              <mat-spinner diameter="30"></mat-spinner>
              <span>{{ translationService.getReactive('chargeInitiation.loadingTariffInformation') }}</span>
            </div>
            
            <div class="tariff-error" *ngIf="userInfoService.error() && !userInfoService.loading()">
              <mat-icon>error</mat-icon>
              <span>{{ translationService.getReactive('chargeInitiation.failedToLoadTariffInformation') }} {{ userInfoService.error() }}</span>
              <button mat-button color="primary" (click)="loadUserInfo()">
                <mat-icon>refresh</mat-icon>
                {{ translationService.getReactive('common.buttons.tryAgain') }}
              </button>
            </div>
            
            <div class="tariff-info" *ngIf="!userInfoService.loading() && !userInfoService.error() && userInfoService.getPaymentPlans().length > 0">
              <div class="tariff-item">
                <span class="tariff-label">{{ translationService.getReactive('chargeInitiation.pricePerKwh') }}</span>
                <span class="tariff-value">€{{ getTariffPrice() }}/{{ translationService.getReactive('common.units.kWh') }}</span>
              </div>
              
              <div class="tariff-item">
                <span class="tariff-label">{{ translationService.getReactive('chargeInitiation.pricePerHour') }}</span>
                <span class="tariff-value">€{{ getTariffHourlyPrice() }}/hour</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Start Charge Button -->
        <div class="start-charge-section">
          <div class="selected-connector-info" *ngIf="selectedConnector()">
            <mat-icon>power</mat-icon>
            <span>{{ translationService.getReactive('chargeInitiation.selectedConnector') }} {{ getConnectorDisplayName(selectedConnector()!) }}</span>
          </div>
          
          <button 
            mat-button 
            color="primary" 
            class="start-charge-button"
            [disabled]="!canStartCharge()"
            (click)="startCharge()">
            <mat-icon>play_arrow</mat-icon>
            {{ translationService.getReactive('chargeInitiation.startCharge') }}
          </button>
          
          <div class="start-charge-info" *ngIf="!canStartCharge()">
            <p>{{ translationService.getReactive('chargeInitiation.selectConnectorToStart') }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charge-initiation-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
    
    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 2rem;
    }
    
    .back-button {
      color: #666;
    }
    
    .header-content {
      flex: 1;
    }
    
    .page-title {
      font-size: 2rem;
      font-weight: 300;
      margin: 0;
      color: #2c3e50;
    }
    
    .page-subtitle {
      font-size: 1.1rem;
      color: #5a6c7d;
      margin: 4px 0 0 0;
    }
    
    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      text-align: center;
    }
    
    .charge-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    mat-card {
      background-color: white !important;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .station-info-card, .connector-selection-card, .payment-method-card, .tariff-card {
      border-radius: 12px;
      overflow: hidden;
      background-color: white !important;
    }
    
    .station-status-icon {
      background: none;
      color: inherit;
    }
    
    .connectors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .connector-option {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 1rem;
      background-color: white;
      transition: all 0.3s ease;
      position: relative;
    }
    
    .connector-option.clickable {
      cursor: pointer;
    }
    
    .connector-option.not-clickable {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .connector-option.clickable:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .connector-option.selected {
      background-color: #e8f5e8;
      border-color: #28a745;
    }
    
    .connector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .connector-header h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .connector-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .connector-info {
      display: flex;
      flex-direction: column;
    }
    
    .connector-label {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .connector-value {
      font-size: 0.9rem;
      color: #2c3e50;
      font-weight: 400;
    }
    
    
    
    .payment-methods-loading {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      justify-content: center;
      color: #6c757d;
    }
    
    .payment-methods-loading span {
      font-size: 0.9rem;
    }
    
    .payment-methods-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
      color: #dc3545;
    }
    
    .payment-methods-error mat-icon {
      font-size: 2rem;
      color: #dc3545;
    }
    
    .payment-methods-error span {
      font-size: 0.9rem;
    }
    
    .payment-methods {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .payment-method-option {
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 1rem;
      background-color: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .payment-method-option:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .payment-method-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .payment-icon {
      color: #6c757d;
      font-size: 1.5rem;
    }
    
    .payment-method-info {
      flex: 1;
    }
    
    .payment-method-info h4 {
      margin: 0;
      color: #2c3e50;
    }
    
    .payment-method-info p {
      margin: 0;
      color: #6c757d;
      font-size: 0.9rem;
    }
    
    .check-icon {
      color: #28a745;
      font-size: 1.5rem;
    }
    
    .payment-method-details {
      display: flex;
      gap: 0.5rem;
    }
    
    .payment-method-label {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .payment-method-value {
      font-size: 0.9rem;
      color: #2c3e50;
      font-weight: 400;
    }
    
    .no-payment-methods {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }
    
    .no-payment-methods mat-icon {
      font-size: 3rem;
      color: #6c757d;
    }
    
    .tariff-loading {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      justify-content: center;
      color: #6c757d;
    }
    
    .tariff-loading span {
      font-size: 0.9rem;
    }
    
    .tariff-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
      color: #dc3545;
    }
    
    .tariff-error mat-icon {
      font-size: 2rem;
      color: #dc3545;
    }
    
    .tariff-error span {
      font-size: 0.9rem;
    }
    
    
    .tariff-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .tariff-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
    
    .tariff-label {
      font-size: 1rem;
      color: #6c757d;
      font-weight: 500;
    }
    
    .tariff-value {
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 600;
    }
    
    .start-charge-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background-color: white;
      border-radius: 12px;
    }
    
    .selected-connector-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: transparent;
      border: none;
      border-radius: 8px;
      color: #2c3e50;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .selected-connector-info mat-icon {
      color: #2c3e50;
      font-size: 1.2rem;
    }
    
    .start-charge-button {
      font-size: 1.2rem;
      padding: 1rem 2rem;
      min-width: 200px;
      border: 2px solid #1976d2 !important;
      background-color: transparent !important;
      color: #1976d2 !important;
    }
    
    .start-charge-button:hover:not(:disabled) {
      background-color: #1976d2 !important;
      color: white !important;
    }
    
    .start-charge-button:disabled {
      border-color: #ccc !important;
      color: #ccc !important;
    }
    
    .start-charge-info {
      text-align: center;
      color: #6c757d;
    }
    
    .start-charge-info p {
      margin: 0;
    }
    
    .available { 
      background-color: #d1fae5;
      color: #10b981;
    }
    .occupied { 
      background-color: #f3f4f6;
      color: #6b7280;
    }
    .out-of-order { 
      background-color: #f3f4f6;
      color: #6b7280;
    }
    .reserved {
      background-color: #f3f4f6;
      color: #6b7280;
    }
    .faulted {
      background-color: #f3f4f6;
      color: #6b7280;
    }
    .unknown {
      background-color: #f3f4f6;
      color: #6b7280;
    }
    
    @media (max-width: 768px) {
      .connectors-grid {
        grid-template-columns: 1fr;
      }
      
      .connector-details {
        grid-template-columns: 1fr 1fr;
      }
    }
  `]
})
export class ChargeInitiationComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargePointService);
  readonly userInfoService = inject(UserInfoService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Signals
  readonly loading = this.chargePointService.loading;
  readonly error = this.chargePointService.error;
  private readonly _stationDetail = signal<StationDetail | null>(null);
  readonly stationDetail = this._stationDetail.asReadonly();
  
  private readonly _selectedConnector = signal<StationDetail['connectors'][0] | null>(null);
  readonly selectedConnector = this._selectedConnector.asReadonly();
  
  private readonly _selectedPaymentMethod = signal<UserPaymentMethod | null>(null);
  readonly selectedPaymentMethod = this._selectedPaymentMethod.asReadonly();
  
  // Payment methods and plans are accessed directly from UserInfoService
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Subscription management
  private authSubscription?: Subscription;
  private authCheckTimeout?: any;

  // Computed values
  readonly allConnectors = computed(() => 
    this._stationDetail()?.connectors || []
  );
  
  readonly availableConnectors = computed(() => 
    this._stationDetail()?.connectors.filter(c => c.status === 'Available') || []
  );
  
  readonly canStartCharge = computed(() => 
    this.selectedConnector() !== null && 
    this.selectedPaymentMethod() !== null &&
    this.selectedConnector()?.status === 'Available'
  );

  ngOnInit() {
    // Initialize translations first
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
      
      // After translations are loaded, set up auth subscription
      this.setupAuthSubscription();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
      // Still set up auth subscription even if translations fail
      this.setupAuthSubscription();
    }
  }

  private setupAuthSubscription(): void {
    // Wait for authentication before loading any data
    this.authSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout);
        }
        
        // Load user info first to get payment methods and tariff data
        this.loadUserInfo();
        
        // Load station details
        this.route.params.subscribe(params => {
          const pointId = params['id'];
          if (pointId) {
            this.loadStationDetail(pointId);
          }
        });
      } else {
        // Give Firebase auth time to restore session on page reload
        this.authCheckTimeout = setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1000);
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.authCheckTimeout) {
      clearTimeout(this.authCheckTimeout);
    }
  }

  loadStationDetail(pointId?: string) {
    const id = pointId || this.route.snapshot.params['id'];
    
    if (id) {
      this.chargePointService.getStationDetail(id).subscribe({
        next: (station) => {
          this._stationDetail.set(station);
        },
        error: (error) => {
          // Error loading station detail - handled by service
        }
      });
    }
  }

  loadUserInfo() {
    this.userInfoService.loadCurrentUserInfo({
      include_payment_methods: true,
      include_payment_plans: true
    }).subscribe({
      next: (userInfo) => {
        // UserInfoService handles data storage automatically
        
        // Preselect the default payment method using UserInfoService data
        this.preselectDefaultPaymentMethod(this.userInfoService.getPaymentMethods());
      },
      error: (error) => {
        // Error loading user info - handled by service
      }
    });
  }

  preselectDefaultPaymentMethod(paymentMethods: UserPaymentMethod[]) {
    if (paymentMethods && paymentMethods.length > 0) {
      // Find the default payment method
      const defaultMethod = paymentMethods.find(method => method.is_default);
      
      if (defaultMethod) {
        this._selectedPaymentMethod.set(defaultMethod);
      } else {
        // If no default method is marked, select the first one
        this._selectedPaymentMethod.set(paymentMethods[0]);
      }
    }
  }

  selectConnector(connector: StationDetail['connectors'][0]) {
    // Only allow selection of available connectors
    if (connector.status === 'Available') {
      this._selectedConnector.set(connector);
    }
  }

  selectPaymentMethod(method: UserPaymentMethod) {
    this._selectedPaymentMethod.set(method);
  }

  getTariffPrice(): number {
    // Use UserInfoService methods directly like Profile component does
    const paymentPlans = this.userInfoService.getPaymentPlans();
    
    if (paymentPlans.length === 0) {
      return 0.25; // Default price when no plans loaded
    }
    
    const defaultPlan = paymentPlans.find(plan => plan.is_default);
    const activePlan = paymentPlans.find(plan => plan.is_active);
    const selectedPlan = defaultPlan || activePlan || paymentPlans[0];
    
    return selectedPlan?.price_per_kwh !== undefined ? selectedPlan.price_per_kwh : 0.25;
  }

  getTariffHourlyPrice(): number {
    // Use UserInfoService methods directly like Profile component does
    const paymentPlans = this.userInfoService.getPaymentPlans();
    
    if (paymentPlans.length === 0) {
      return 2.50; // Default price when no plans loaded
    }
    
    const defaultPlan = paymentPlans.find(plan => plan.is_default);
    const activePlan = paymentPlans.find(plan => plan.is_active);
    const selectedPlan = defaultPlan || activePlan || paymentPlans[0];
    
    return selectedPlan?.price_per_hour !== undefined ? selectedPlan.price_per_hour : 2.50;
  }


  getTariffDescription(): string {
    // Use UserInfoService methods directly like Profile component does
    const paymentPlans = this.userInfoService.getPaymentPlans();
    
    if (paymentPlans.length === 0) {
      return 'Loading tariff information...';
    }
    
    const defaultPlan = paymentPlans.find(plan => plan.is_default);
    const activePlan = paymentPlans.find(plan => plan.is_active);
    const selectedPlan = defaultPlan || activePlan || paymentPlans[0];
    
    return selectedPlan?.description || 'Standard charging tariff';
  }


  getCardBrandName(cardBrand: string): string {
    return this.userInfoService.getCardBrandName(cardBrand);
  }

  getCountryName(countryCode: string): string {
    return this.userInfoService.getCountryName(countryCode);
  }

  formatExpiryDate(expiryDate: string): string {
    return this.userInfoService.formatExpiryDate(expiryDate);
  }

  getStatusIcon(): string {
    const station = this.stationDetail();
    if (!station) return 'help';
    if (!station.is_online) return 'wifi_off';
    const availableConnectors = station.connectors.filter(c => c.status === 'Available').length;
    return availableConnectors > 0 ? 'check_circle' : 'warning';
  }

  getStatusIconClass(): string {
    const station = this.stationDetail();
    if (!station) return '';
    if (!station.is_online) return 'status-offline';
    const availableConnectors = station.connectors.filter(c => c.status === 'Available').length;
    return availableConnectors > 0 ? 'status-available' : 'status-unavailable-yellow';
  }

  getConnectorStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'available';
      case 'occupied': return 'occupied';
      case 'charging': return 'occupied';
      case 'outoforder': return 'out-of-order';
      case 'out_of_order': return 'out-of-order';
      case 'faulted': return 'faulted';
      case 'reserved': return 'reserved';
      case 'unavailable': return 'unknown';
      default: return 'unknown';
    }
  }

  getConnectorDisplayName(connector: StationDetail['connectors'][0]): string {
    return connector.connector_id_name || connector.connector_id.toString();
  }

  startCharge() {
    if (!this.canStartCharge()) {
      if (!this.selectedConnector()) {
        this.notificationService.warning(this.translationService.get('chargeInitiation.selectConnectorToStart'));
      } else if (!this.selectedPaymentMethod()) {
        this.notificationService.warning(this.translationService.get('chargeInitiation.selectPaymentMethodToStart'));
      } else {
        this.notificationService.warning(this.translationService.get('chargeInitiation.selectConnectorToStart'));
      }
      return;
    }

    const connector = this.selectedConnector();
    const paymentMethod = this.selectedPaymentMethod();
    
    if (!connector || !paymentMethod) {
      this.notificationService.error('Missing required information');
      return;
    }

    // TODO: Implement actual charge start logic

    this.notificationService.success('Charging started successfully!');
    this.router.navigate(['/sessions/active']);
  }

  goBack() {
    // Use browser history to go back to the previous page
    // This will naturally return to dashboard if user came from dashboard,
    // or to station details if user came from station details
    this.location.back();
  }

  goToProfile() {
    this.router.navigate(['/profile/payment']);
  }
}
