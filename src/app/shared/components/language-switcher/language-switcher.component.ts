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
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss'
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
