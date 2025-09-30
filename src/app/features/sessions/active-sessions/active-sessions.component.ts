import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="active-sessions-container">
      <h1 class="page-title">{{ translationService.getReactive('pages.sessions.active.title') }}</h1>
      <p class="page-subtitle">{{ translationService.getReactive('pages.sessions.active.subtitle') }}</p>
      <p>{{ translationService.getReactive('pages.sessions.active.comingSoon') }}</p>
    </div>
  `,
  styles: [`
    .active-sessions-container {
      padding: 20px;
    }
  `]
})
export class ActiveSessionsComponent {
  protected readonly translationService = inject(SimpleTranslationService);
}
