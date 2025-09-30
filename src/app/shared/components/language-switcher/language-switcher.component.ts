import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <div class="language-switcher-container">
      <button 
        mat-icon-button 
        (click)="toggleMenu()"
        [attr.aria-label]="translationService.getReactive('language.switcher')"
        class="language-switcher">
        <span class="language-code">{{ currentLanguage().toUpperCase() }}</span>
      </button>
      
      <div class="language-dropdown" [class.show]="isMenuOpen()">
        <button 
          *ngFor="let lang of availableLanguages"
          (click)="switchLanguage(lang.code)"
          [class.active]="lang.code === currentLanguage()"
          type="button"
          class="menu-item">
          <mat-icon *ngIf="lang.code === currentLanguage()">check</mat-icon>
          <span>{{ lang.name }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .language-switcher-container {
      position: relative;
      display: inline-block;
    }
    
    .language-switcher {
      color: var(--energy-amber, #ffc107) !important;
      border-radius: var(--energy-radius-lg, 12px);
      transition: all 0.2s ease;
      background-color: rgba(255, 255, 255, 0.15) !important;
      border: 1px solid var(--energy-amber, #ffc107) !important;
      backdrop-filter: blur(4px);
      margin: 0 var(--energy-space-sm, 8px);
      box-shadow: var(--energy-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.1));
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 40px !important;
      height: 40px !important;
      
      &:hover {
        background-color: var(--energy-amber, #ffc107) !important;
        color: var(--energy-gray-800, #1e293b) !important;
        border-color: var(--energy-amber-dark, #ff8f00) !important;
        transform: translateY(-1px);
        box-shadow: var(--energy-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: var(--energy-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      }
      
      .language-code {
        font-size: 0.875rem;
        font-weight: 600;
        color: inherit !important;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1;
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
    }
    
    .language-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 140px;
      border-radius: var(--energy-radius-lg, 12px);
      box-shadow: var(--energy-shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
      border: 1px solid var(--energy-gray-200, #e2e8f0);
      background: white;
      z-index: 1000 !important;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      
      &.show {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
    }
    
    .menu-item {
      display: flex !important;
      align-items: center !important;
      gap: var(--energy-space-sm, 8px) !important;
      padding: var(--energy-space-md, 16px) !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      cursor: pointer !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 1001 !important;
      width: 100% !important;
      text-align: left !important;
      border: none !important;
      background: transparent !important;
      
      &:hover {
        background-color: var(--energy-cyan-light, #4dd0e1) !important;
        color: white !important;
      }
      
      &.active {
        background-color: var(--energy-cyan, #00bcd4) !important;
        color: white !important;
        font-weight: 600 !important;
        
        mat-icon {
          color: white !important;
        }
      }
      
      mat-icon {
        font-size: 1rem !important;
        width: 1rem !important;
        height: 1rem !important;
        margin-right: 0 !important;
        color: var(--energy-cyan, #00bcd4) !important;
      }
    }
  `]
})
export class LanguageSwitcherComponent {
  readonly translationService = inject(SimpleTranslationService);
  
  readonly currentLanguage = this.translationService.currentLanguage;
  private readonly _isMenuOpen = signal(false);
  
  readonly isMenuOpen = this._isMenuOpen.asReadonly();
  
  get availableLanguages() {
    return this.translationService.getAvailableLanguagesWithNames();
  }
  
  toggleMenu(): void {
    this._isMenuOpen.set(!this._isMenuOpen());
  }
  
  async switchLanguage(languageCode: string): Promise<void> {
    try {
      await this.translationService.setLanguage(languageCode);
      this._isMenuOpen.set(false); // Close menu after selection
    } catch (error) {
      console.error('Error switching language:', error);
    }
  }
}
