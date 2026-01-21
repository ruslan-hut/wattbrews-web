import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorMessageComponent {
  icon = input<string>('error');
  title = input<string>('Something went wrong');
  message = input<string>('An unexpected error occurred. Please try again.');
  showRetry = input<boolean>(true);
  retryText = input<string>('Try Again');
  onRetry = output<void>();
}
