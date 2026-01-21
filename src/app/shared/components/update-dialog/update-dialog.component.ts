import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({
  selector: 'app-update-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
],
  templateUrl: './update-dialog.component.html',
  styleUrl: './update-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UpdateDialogComponent>);
  protected readonly translationService = inject(SimpleTranslationService);

  update(): void {
    this.dialogRef.close(true);
  }

  later(): void {
    this.dialogRef.close(false);
  }
}
