import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { catchError, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LanguageSwitcherComponent } from '../../shared';
import { SimpleTranslationService } from '../../core/services';

type LegalKind = 'privacy' | 'terms';

interface LegalSection {
  title: string;
  content: string[];
  list?: string[];
}

interface LegalContent {
  title: string;
  introduction?: string;
  thirdPartyNotice?: string;
  sections?: LegalSection[];
  unsubscribeSection?: LegalSection;
  contactInfo?: LegalSection;
}

@Component({
  selector: 'app-legal-page',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'legal-host' }
})
export class LegalPageComponent {
  protected readonly translationService = inject(SimpleTranslationService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  protected readonly content = signal<LegalContent | null>(null);
  protected readonly loading = signal(true);

  protected readonly kind = computed<LegalKind>(
    () => (this.route.snapshot.data['kind'] as LegalKind) ?? 'privacy'
  );

  constructor() {
    void this.translationService.initializeTranslationsAsync();

    effect(() => {
      const kind = this.kind();
      const lang = this.translationService.currentLanguage();
      this.fetch(kind, lang);
    });
  }

  protected goBack(): void {
    this.location.back();
  }

  private fetch(kind: LegalKind, lang: string): void {
    this.loading.set(true);
    this.loadFile(`assets/legal/${kind}-${lang}.json`).subscribe(data => {
      if (data) {
        this.content.set(data);
        this.loading.set(false);
        return;
      }
      this.loadFile(`assets/legal/${kind}-en.json`).subscribe(fallback => {
        this.content.set(fallback);
        this.loading.set(false);
      });
    });
  }

  private loadFile(path: string) {
    return this.http
      .get<LegalContent>(path)
      .pipe(catchError(() => of(null as LegalContent | null)));
  }
}
