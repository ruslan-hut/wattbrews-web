import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { SimpleTranslationService } from '../../core/services/simple-translation.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    LanguageSwitcherComponent
  ],
  template: `
    <div class="auth-container">
      <mat-toolbar color="primary" class="auth-toolbar">
        <div class="toolbar-content">
          <div class="logo-section">
            <mat-icon class="logo-icon">ev_station</mat-icon>
            <span class="logo-text">{{ translationService.getReactive('app.title') }}</span>
          </div>
          <div class="toolbar-actions">
            <app-language-switcher></app-language-switcher>
            <button mat-button routerLink="/" class="home-button">
              <mat-icon>home</mat-icon>
              {{ translationService.getReactive('nav.home') }}
            </button>
          </div>
        </div>
      </mat-toolbar>
      
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
      
      <footer class="auth-footer">
        <p>&copy; 2024 {{ translationService.getReactive('app.title') }}. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" class="footer-link">{{ translationService.getReactive('footer.privacy') }}</a>
          <a href="#" class="footer-link">{{ translationService.getReactive('footer.terms') }}</a>
          <a href="#" class="footer-link">{{ translationService.getReactive('footer.support') }}</a>
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
    
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
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
  readonly translationService = inject(SimpleTranslationService);
  protected readonly appTitle = signal('WattBrews');
}
