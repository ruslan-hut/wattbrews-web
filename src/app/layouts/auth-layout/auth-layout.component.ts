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
        <div class="auth-card">
          <router-outlet></router-outlet>
        </div>
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
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .auth-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
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
    }
    
    .logo-text {
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    .home-button {
      color: white;
    }
    
    .auth-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .auth-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      min-height: 400px;
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
        padding: 1rem;
      }
      
      .auth-card {
        padding: 1.5rem;
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
