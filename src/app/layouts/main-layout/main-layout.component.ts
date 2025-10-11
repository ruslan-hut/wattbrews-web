import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { ConnectionStatusComponent } from '../../shared/components/connection-status/connection-status.component';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    LanguageSwitcherComponent,
    ConnectionStatusComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly websocketService = inject(WebsocketService);
  private readonly router = inject(Router);
  readonly translationService = inject(SimpleTranslationService);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Subscription management
  private languageSubscription?: Subscription;
  
  protected readonly appTitle = signal('WattBrews');
  protected readonly sidenavOpen = signal(false);
  protected readonly userName = this.authService.userName;
  protected readonly isAdmin = computed(() => 
    this.authService.hasAnyRole(['admin'])
  );

  ngOnInit(): void {
    // Initialize translations first
    this.initializeTranslations();
    
    // Initialize WebSocket connection for real-time updates
    this.initializeWebSocket();
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

  /**
   * Initialize WebSocket connection for real-time updates
   * Connection is maintained throughout the app lifecycle
   * 
   * Note: WebSocket connects regardless of authentication state.
   * Commands requiring authentication will be skipped until user logs in.
   */
  private initializeWebSocket(): void {
    // Connect to WebSocket server
    this.websocketService.connect();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
    
    // WebSocket will be cleaned up by the service's DestroyRef
  }
  
  toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }
  
  closeSidenav(): void {
    this.sidenavOpen.set(false);
  }
  
  hasActiveSessions(): boolean {
    // TODO: Implement actual check for active sessions
    return false;
  }
  
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
  
}
