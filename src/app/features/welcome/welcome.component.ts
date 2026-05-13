import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LanguageSwitcherComponent } from '../../shared';
import { SimpleTranslationService } from '../../core/services';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=energy.h2plt.evcharge';

@Component({
  selector: 'app-welcome',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'welcome-host' }
})
export class WelcomeComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);
  protected readonly playStoreUrl = PLAY_STORE_URL;

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
    } catch (error) {
      console.error('Failed to initialize translations:', error);
    } finally {
      this.translationsLoading.set(false);
    }
  }
}
