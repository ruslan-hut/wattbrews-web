import { Component, input, ChangeDetectionStrategy } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  diameter = input<number>(50);
  color = input<string>('primary');
  mode = input<'determinate' | 'indeterminate'>('indeterminate');
  message = input<string>('');
  overlay = input<boolean>(false);
}
