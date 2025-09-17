import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

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
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="'navigation'"
          [mode]="'over'"
          [opened]="sidenavOpen()">
        <mat-toolbar>Menu</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" (click)="closeSidenav()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/stations" (click)="closeSidenav()">
            <mat-icon matListItemIcon>ev_station</mat-icon>
            <span matListItemTitle>Stations</span>
          </a>
          <a mat-list-item routerLink="/sessions/active" (click)="closeSidenav()">
            <mat-icon matListItemIcon>charging_station</mat-icon>
            <span matListItemTitle>Active Sessions</span>
            <mat-icon matListItemMeta *ngIf="hasActiveSessions()" matBadge="1" matBadgeColor="warn">notifications</mat-icon>
          </a>
          <a mat-list-item routerLink="/sessions/history" (click)="closeSidenav()">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>History</span>
          </a>
          <a mat-list-item routerLink="/profile" (click)="closeSidenav()">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>Profile</span>
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
          <span>{{ appTitle() }}</span>
          <span class="spacer"></span>
          <div class="user-info" *ngIf="userName()">
            <span class="user-name">{{ userName() }}</span>
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
          </div>
          <button mat-icon-button [matMenuTriggerFor]="userMenu" *ngIf="!userName()">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
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
    }
    
    .user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: white;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
    }
    
    @media (max-width: 768px) {
      .main-content {
        padding: 10px;
      }
    }
  `]
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  protected readonly appTitle = signal('WattBrews');
  protected readonly sidenavOpen = signal(false);
  protected readonly userName = this.authService.userName;
  
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
}
