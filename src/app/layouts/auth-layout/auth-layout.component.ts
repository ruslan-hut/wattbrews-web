import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="auth-container">
      <mat-toolbar color="primary" class="auth-toolbar">
        <div class="toolbar-content">
          <div class="logo-section">
            <mat-icon class="logo-icon">ev_station</mat-icon>
            <span class="logo-text">{{ appTitle() }}</span>
          </div>
          <button mat-button routerLink="/" class="home-button">
            <mat-icon>home</mat-icon>
            Home
          </button>
        </div>
      </mat-toolbar>
      
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
      
      <footer class="auth-footer">
        <p>&copy; 2024 {{ appTitle() }}. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Service</a>
          <a href="#" class="footer-link">Support</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .auth-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }
    
    .auth-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .logo-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: white;
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 500;
      color: white;
    }
    
    .home-button {
      color: white !important;
    }
    
    .auth-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
    }
    
    .auth-footer {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      text-align: center;
      padding: 1rem;
      margin-top: auto;
    }
    
    .footer-links {
      margin-top: 0.5rem;
    }
    
    .footer-link {
      color: white;
      text-decoration: none;
      margin: 0 1rem;
      opacity: 0.8;
    }
    
    .footer-link:hover {
      opacity: 1;
    }
    
    @media (max-width: 768px) {
      .auth-content {
        padding: 0;
      }
      
      .footer-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class AuthLayoutComponent {
  protected readonly appTitle = signal('WattBrews');
}
