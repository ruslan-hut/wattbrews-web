import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './active-sessions.component.html',
  styleUrl: './active-sessions.component.scss'
})
export class ActiveSessionsComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  
  // Translation loading state
  protected readonly translationsLoading = signal(true);

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
}
