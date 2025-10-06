import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-sessions.component.html',
  styleUrl: './active-sessions.component.scss'
})
export class ActiveSessionsComponent {
  protected readonly translationService = inject(SimpleTranslationService);
}
