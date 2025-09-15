import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-container">
      <h2>Payment Methods</h2>
      <p>Payment component - Coming soon</p>
    </div>
  `,
  styles: [`
    .payment-container {
      padding: 20px;
    }
  `]
})
export class PaymentComponent {}
