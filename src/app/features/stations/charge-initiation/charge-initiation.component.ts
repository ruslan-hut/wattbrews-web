import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChargePointService } from '../../../core/services/chargepoint.service';
import { UserInfoService } from '../../../core/services/user-info.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';
import { StationDetail } from '../../../core/models/station-detail.model';
import { UserPaymentMethod, PaymentPlan } from '../../../core/models/user-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { TransactionStartDialogComponent } from '../../../shared/components/transaction-start-dialog/transaction-start-dialog.component';
import { ConnectorUtils } from '../../../shared/utils/connector.utils';

@Component({
  selector: 'app-charge-initiation',
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
    MatDialogModule,
    LoadingSpinnerComponent,
    ErrorMessageComponent
  ],
  templateUrl: './charge-initiation.component.html',
  styleUrl: './charge-initiation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  private readonly dialog = inject(MatDialog);

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
    this._stationDetail()?.connectors.filter(c => ConnectorUtils.isAvailable(c.status)) || []
  );
  
  readonly canStartCharge = computed(() => 
    this.selectedConnector() !== null && 
    this.selectedPaymentMethod() !== null &&
    this.selectedConnector() !== null &&
    ConnectorUtils.isAvailable(this.selectedConnector()!.status)
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
    if (ConnectorUtils.isAvailable(connector.status)) {
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
    const availableConnectors = station.connectors.filter(c => ConnectorUtils.isAvailable(c.status)).length;
    return availableConnectors > 0 ? 'check_circle' : 'warning';
  }

  getStatusIconClass(): string {
    const station = this.stationDetail();
    if (!station) return '';
    if (!station.is_online) return 'status-offline';
    const availableConnectors = station.connectors.filter(c => ConnectorUtils.isAvailable(c.status)).length;
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

  isAvailable(status: string): boolean {
    return ConnectorUtils.isAvailable(status);
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
    const station = this.stationDetail();
    
    if (!connector || !paymentMethod || !station) {
      this.notificationService.error('Missing required information');
      return;
    }

    // Open transaction start dialog
    const dialogRef = this.dialog.open(TransactionStartDialogComponent, {
      data: {
        chargePointId: station.charge_point_id,
        connectorId: connector.connector_id,
        stationTitle: station.title
      },
      disableClose: true, // Prevent closing by clicking outside
      width: '500px',
      maxWidth: '95vw'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        console.log('Transaction started successfully with ID:', result.transactionId);
        // Navigation is handled by the dialog component
      } else {
        console.log('Transaction start cancelled or failed');
      }
    });
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
