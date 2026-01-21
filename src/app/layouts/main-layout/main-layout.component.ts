import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { ConnectionStatusComponent } from '../../shared/components/connection-status/connection-status.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
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
    ConnectionStatusComponent,
    ThemeToggleComponent
],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly websocketService = inject(WebsocketService);
  private readonly router = inject(Router);
  readonly translationService = inject(SimpleTranslationService);
  readonly themeService = inject(ThemeService);

  // Translation loading state
  protected readonly translationsLoading = signal(true);

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
