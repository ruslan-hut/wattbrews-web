import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { SimpleTranslationService } from '../../../../core/services/simple-translation.service';

/**
 * Data passed to the confirm-delete dialog. The `title` and `message`
 * keys are i18n keys the dialog resolves through the translation
 * service — no raw strings cross the component boundary.
 */
export interface ConfirmDeleteDialogData {
  /** Translation key for the dialog title. */
  titleKey: string;
  /** Translation key for the dialog message. */
  messageKey: string;
  /**
   * Optional subject line shown under the message — used to display
   * the specific resource being deleted (e.g. "Visa •••• 4242").
   * Not translated; caller formats it.
   */
  subject?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrl: './confirm-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent, boolean>);
  protected readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
  protected readonly translationService = inject(SimpleTranslationService);

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
