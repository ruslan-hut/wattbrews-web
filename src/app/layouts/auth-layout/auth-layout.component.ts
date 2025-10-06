import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
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
    MatProgressSpinnerModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  readonly translationService = inject(SimpleTranslationService);
  protected readonly appTitle = signal('WattBrews');
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);
  
  // Subscription management
  private languageSubscription?: Subscription;

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
}
