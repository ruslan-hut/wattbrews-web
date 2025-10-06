import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
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
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
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
    LanguageSwitcherComponent
  ],
  template: `
    <!-- Translation Loading State -->
    <div class="loading-container" *ngIf="translationsLoading()">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Loading translations...</p>
    </div>

    <!-- Main Layout (only show when translations are loaded) -->
    <mat-sidenav-container class="sidenav-container" *ngIf="!translationsLoading()">
      <!-- Sidebar -->
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="'navigation'"
          [mode]="'over'"
          [opened]="sidenavOpen()">
        <mat-toolbar>Menu</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" (click)="closeSidenav()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>{{ translationService.getReactive('nav.dashboard') }}</span>
          </a>
          <a mat-list-item routerLink="/stations" (click)="closeSidenav()">
            <mat-icon matListItemIcon>ev_station</mat-icon>
            <span matListItemTitle>{{ translationService.getReactive('nav.stations') }}</span>
          </a>
          <a mat-list-item routerLink="/sessions/active" (click)="closeSidenav()">
            <mat-icon matListItemIcon>charging_station</mat-icon>
            <span matListItemTitle>{{ translationService.getReactive('session.active') }}</span>
            <mat-icon matListItemMeta *ngIf="hasActiveSessions()" matBadge="1" matBadgeColor="warn">notifications</mat-icon>
          </a>
          <a mat-list-item routerLink="/sessions/history" (click)="closeSidenav()">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>{{ translationService.getReactive('session.history') }}</span>
          </a>
          <a mat-list-item routerLink="/profile" (click)="closeSidenav()">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>{{ translationService.getReactive('nav.profile') }}</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <!-- Main content -->
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button
            type="button"
            aria-label="Toggle sidenav"
            mat-icon-button
            (click)="toggleSidenav()">
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          <span>{{ translationService.getReactive('app.title') }}</span>
          <span class="spacer"></span>
          
          <!-- Language Switcher -->
          <app-language-switcher></app-language-switcher>
          
          <!-- Authenticated user menu -->
          <div class="user-info" *ngIf="userName()">
            <span class="user-name">{{ userName() }}</span>
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
          </div>
          
          <!-- Login button for unauthenticated users -->
          <button mat-button color="accent" (click)="navigateToLogin()" *ngIf="!userName()">
            <mat-icon>login</mat-icon>
            {{ translationService.getReactive('nav.auth') }}
          </button>
          
          <!-- User menu (only visible for authenticated users) -->
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>{{ translationService.getReactive('nav.profile') }}</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>{{ translationService.getReactive('auth.signout') }}</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }
    
    .sidenav {
      width: 250px;
    }
    
    .sidenav .mat-toolbar {
      background: inherit;
    }
    
    .mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(4px);
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
    
    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: inherit;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 1;
    }
    
    button[mat-button] {
      color: white !important;
      background-color: var(--energy-cyan, #00bcd4) !important;
      border: 1px solid var(--energy-cyan-dark, #0097a7) !important;
      border-radius: var(--energy-radius-lg, 12px);
      padding: 8px 16px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: var(--energy-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      
      &:hover {
        background-color: var(--energy-cyan-dark, #0097a7) !important;
        border-color: var(--energy-cyan-dark, #0097a7) !important;
        transform: translateY(-1px);
        box-shadow: var(--energy-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: var(--energy-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      }
      
      mat-icon {
        margin-right: 8px;
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
        color: white !important;
      }
    }
    
    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      height: 100vh;
      background-color: #f8f9fa;
    }
    
    .loading-container p {
      margin: 0;
      color: #5a6c7d;
      font-size: 1rem;
    }
    
    @media (max-width: 768px) {
      .main-content {
        padding: 10px;
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly translationService = inject(SimpleTranslationService);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Subscription management
  private languageSubscription?: Subscription;
  
  protected readonly appTitle = signal('WattBrews');
  protected readonly sidenavOpen = signal(false);
  protected readonly userName = this.authService.userName;

  ngOnInit(): void {
    // Initialize translations first
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

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
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
