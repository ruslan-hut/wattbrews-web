import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
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
