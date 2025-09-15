import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="error-container">
      <mat-icon class="error-icon">{{ icon }}</mat-icon>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      <button 
        *ngIf="showRetry" 
        mat-raised-button 
        color="primary" 
        (click)="onRetry.emit()"
        class="retry-button">
        {{ retryText }}
      </button>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
      min-height: 200px;
    }
    
    .error-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      color: #f44336;
      margin-bottom: 1rem;
    }
    
    .error-title {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    .error-message {
      margin: 0 0 2rem 0;
      color: #666;
      font-size: 1rem;
      line-height: 1.5;
      max-width: 400px;
    }
    
    .retry-button {
      margin-top: 1rem;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() icon: string = 'error';
  @Input() title: string = 'Something went wrong';
  @Input() message: string = 'An unexpected error occurred. Please try again.';
  @Input() showRetry: boolean = true;
  @Input() retryText: string = 'Try Again';
  @Output() onRetry = new EventEmitter<void>();
}
