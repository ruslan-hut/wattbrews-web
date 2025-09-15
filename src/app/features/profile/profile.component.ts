import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <h2>Profile</h2>
      <p>Profile component - Coming soon</p>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 20px;
    }
  `]
})
export class ProfileComponent {}
