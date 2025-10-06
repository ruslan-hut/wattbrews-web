import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent {
  @Input() icon: string = 'error';
  @Input() title: string = 'Something went wrong';
  @Input() message: string = 'An unexpected error occurred. Please try again.';
  @Input() showRetry: boolean = true;
  @Input() retryText: string = 'Try Again';
  @Output() onRetry = new EventEmitter<void>();
}
