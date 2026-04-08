import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SimpleTranslationService } from '../../../../core/services/simple-translation.service';

/**
 * Data passed in when opening the dialog. We only need the two
 * mutable fields — description and is_default — plus a pre-computed
 * subtitle (brand + last 4) to orient the user about which card they
 * are editing.
 */
export interface EditCardDialogData {
  description: string;
  is_default: boolean;
  subtitle: string;
}

/**
 * Result emitted on successful save. `undefined` (dialog dismissed)
 * means the caller should not touch the backend.
 */
export interface EditCardDialogResult {
  description: string;
  is_default: boolean;
}

@Component({
  selector: 'app-edit-card-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './edit-card-dialog.component.html',
  styleUrl: './edit-card-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditCardDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject(MatDialogRef<EditCardDialogComponent, EditCardDialogResult | undefined>);
  protected readonly data = inject<EditCardDialogData>(MAT_DIALOG_DATA);
  protected readonly translationService = inject(SimpleTranslationService);

  protected readonly form = this.fb.nonNullable.group({
    description: [this.data.description, [Validators.required, Validators.maxLength(64)]],
    is_default: [this.data.is_default],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      description: value.description.trim(),
      is_default: value.is_default,
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
