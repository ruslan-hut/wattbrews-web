# Energy Theme Component Examples

This document provides practical examples of how to implement the WattBrews Energy Theme design system in your components.

## Basic Card Component

```html
<mat-card class="energy-card-elevated energy-p-lg">
  <mat-card-header>
    <mat-card-title class="energy-text-primary">Charging Station Status</mat-card-title>
    <mat-card-subtitle class="energy-text-muted">Station ID: CP-001</mat-card-subtitle>
  </mat-card-header>
  
  <mat-card-content>
    <div class="energy-status-online energy-text-success">
      Online and Available
    </div>
    
    <div class="energy-m-md">
      <span class="energy-text-tertiary">Power Output:</span>
      <span class="energy-text-primary">22 kW</span>
    </div>
  </mat-card-content>
  
  <mat-card-actions>
    <button mat-raised-button class="energy-button-primary">
      <mat-icon class="energy-m-sm">visibility</mat-icon>
      View Details
    </button>
  </mat-card-actions>
</mat-card>
```

## Status Chip Examples

```html
<!-- Success Status -->
<mat-chip class="energy-chip-success">
  <mat-icon class="energy-m-xs">check_circle</mat-icon>
  Charging Complete
</mat-chip>

<!-- Warning Status -->
<mat-chip class="energy-chip-warning">
  <mat-icon class="energy-m-xs">warning</mat-icon>
  Low Battery
</mat-chip>

<!-- Error Status -->
<mat-chip class="energy-chip-error">
  <mat-icon class="energy-m-xs">error</mat-icon>
  Connection Failed
</mat-chip>

<!-- Info Status -->
<mat-chip class="energy-chip-info">
  <mat-icon class="energy-m-xs">info</mat-icon>
  Maintenance Mode
</mat-chip>
```

## Form Field Example

```html
<form class="energy-p-lg">
  <mat-form-field appearance="outline" class="full-width">
    <mat-label>Station Name</mat-label>
    <input matInput placeholder="Enter station name" formControlName="name">
    <mat-icon matSuffix class="energy-text-primary">ev_station</mat-icon>
  </mat-form-field>
  
  <mat-form-field appearance="outline" class="full-width">
    <mat-label>Power Output (kW)</mat-label>
    <input matInput type="number" placeholder="22" formControlName="power">
    <mat-icon matSuffix class="energy-text-primary">electrical_services</mat-icon>
  </mat-form-field>
  
  <div class="energy-m-lg">
    <button mat-raised-button type="submit" class="energy-button-primary">
      <mat-icon class="energy-m-sm">save</mat-icon>
      Save Station
    </button>
    
    <button mat-stroked-button type="button" class="energy-m-sm">
      Cancel
    </button>
  </div>
</form>
```

## Navigation Menu Example

```html
<mat-toolbar class="energy-bg-primary">
  <button mat-icon-button>
    <mat-icon>menu</mat-icon>
  </button>
  
  <span class="energy-text-white">WattBrews</span>
  
  <span class="spacer"></span>
  
  <button mat-icon-button>
    <mat-icon class="energy-text-white">notifications</mat-icon>
  </button>
</mat-toolbar>

<mat-sidenav-container>
  <mat-sidenav>
    <mat-nav-list>
      <a mat-list-item routerLink="/dashboard">
        <mat-icon matListItemIcon class="energy-text-primary">dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      
      <a mat-list-item routerLink="/stations">
        <mat-icon matListItemIcon class="energy-text-primary">ev_station</mat-icon>
        <span matListItemTitle>Stations</span>
      </a>
      
      <a mat-list-item routerLink="/sessions">
        <mat-icon matListItemIcon class="energy-text-primary">battery_charging_full</mat-icon>
        <span matListItemTitle>Sessions</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>
  
  <mat-sidenav-content>
    <!-- Main content here -->
  </mat-sidenav-content>
</mat-sidenav-container>
```

## Data Table Example

```html
<mat-card class="energy-p-lg">
  <mat-card-header>
    <mat-card-title class="energy-text-primary">Charging Sessions</mat-card-title>
  </mat-card-header>
  
  <mat-card-content>
    <table mat-table [dataSource]="sessions" class="full-width">
      <ng-container matColumnDef="station">
        <th mat-header-cell *matHeaderCellDef>Station</th>
        <td mat-cell *matCellDef="let session">
          <div class="energy-text-tertiary">{{ session.stationName }}</div>
        </td>
      </ng-container>
      
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let session">
          <mat-chip [class]="getStatusChipClass(session.status)">
            <mat-icon class="energy-m-xs">{{ getStatusIcon(session.status) }}</mat-icon>
            {{ session.status }}
          </mat-chip>
        </td>
      </ng-container>
      
      <ng-container matColumnDef="energy">
        <th mat-header-cell *matHeaderCellDef>Energy</th>
        <td mat-cell *matCellDef="let session">
          <span class="energy-text-primary">{{ session.energy }} kWh</span>
        </td>
      </ng-container>
      
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  </mat-card-content>
</mat-card>
```

## Loading and Error States

```html
<!-- Loading State -->
<div class="energy-p-xl" *ngIf="loading">
  <div class="energy-text-center">
    <mat-spinner diameter="40" class="energy-m-md"></mat-spinner>
    <p class="energy-text-muted">Loading charging stations...</p>
  </div>
</div>

<!-- Error State -->
<div class="energy-p-xl" *ngIf="error">
  <div class="energy-text-center">
    <mat-icon class="energy-text-error energy-m-md" style="font-size: 48px;">error</mat-icon>
    <h3 class="energy-text-error energy-m-md">Failed to Load Data</h3>
    <p class="energy-text-muted energy-m-lg">{{ error.message }}</p>
    <button mat-raised-button class="energy-button-primary" (click)="retry()">
      <mat-icon class="energy-m-sm">refresh</mat-icon>
      Try Again
    </button>
  </div>
</div>

<!-- Empty State -->
<div class="energy-p-xl" *ngIf="!loading && !error && data.length === 0">
  <div class="energy-text-center">
    <mat-icon class="energy-text-muted energy-m-md" style="font-size: 48px;">ev_station</mat-icon>
    <h3 class="energy-text-muted energy-m-md">No Stations Found</h3>
    <p class="energy-text-muted energy-m-lg">No charging stations are available in your area.</p>
    <button mat-raised-button class="energy-button-primary" (click)="addStation()">
      <mat-icon class="energy-m-sm">add</mat-icon>
      Add Station
    </button>
  </div>
</div>
```

## Responsive Grid Layout

```html
<div class="energy-p-lg">
  <h2 class="energy-text-primary energy-m-lg">Charging Stations</h2>
  
  <div class="stations-grid">
    <mat-card *ngFor="let station of stations" class="station-card energy-card-elevated">
      <mat-card-header>
        <div mat-card-avatar class="station-icon energy-bg-primary">
          <mat-icon class="energy-text-white">ev_station</mat-icon>
        </div>
        <mat-card-title class="energy-text-primary">{{ station.name }}</mat-card-title>
        <mat-card-subtitle class="energy-text-muted">{{ station.address }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="energy-status-online energy-text-success energy-m-sm">
          Available
        </div>
        
        <div class="energy-m-sm">
          <span class="energy-text-muted">Power:</span>
          <span class="energy-text-primary">{{ station.power }} kW</span>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button class="energy-button-primary">
          <mat-icon class="energy-m-sm">visibility</mat-icon>
          View Details
        </button>
      </mat-card-actions>
    </mat-card>
  </div>
</div>
```

```scss
// Component-specific styles
.stations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--energy-space-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.station-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--energy-radius-md);
}

.energy-text-center {
  text-align: center;
}
```

## Best Practices

### 1. Use Utility Classes
```html
<!-- ✅ Good - Using utility classes -->
<div class="energy-p-lg energy-bg-light energy-rounded-lg">
  <h3 class="energy-text-primary">Station Details</h3>
</div>

<!-- ❌ Bad - Inline styles -->
<div style="padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
  <h3 style="color: #00bcd4;">Station Details</h3>
</div>
```

### 2. Semantic Color Usage
```html
<!-- ✅ Good - Semantic colors -->
<span class="energy-text-success">Online</span>
<span class="energy-text-error">Offline</span>
<span class="energy-text-warning">Maintenance</span>

<!-- ❌ Bad - Direct color values -->
<span style="color: green;">Online</span>
<span style="color: red;">Offline</span>
```

### 3. Consistent Spacing
```html
<!-- ✅ Good - Using spacing scale -->
<div class="energy-m-lg energy-p-md">
  <h2 class="energy-m-md">Title</h2>
  <p class="energy-m-sm">Description</p>
</div>

<!-- ❌ Bad - Arbitrary spacing -->
<div style="margin: 30px; padding: 15px;">
  <h2 style="margin: 20px;">Title</h2>
  <p style="margin: 8px;">Description</p>
</div>
```

### 4. Icon Consistency
```html
<!-- ✅ Good - Consistent icon usage -->
<mat-icon class="energy-text-primary energy-m-sm">ev_station</mat-icon>
<span>Charging Station</span>

<!-- ❌ Bad - Inconsistent spacing -->
<mat-icon style="color: #00bcd4; margin-right: 10px;">ev_station</mat-icon>
<span>Charging Station</span>
```

## Component Integration Checklist

When creating new components, ensure:

- [ ] Uses energy theme utility classes
- [ ] Follows the color palette
- [ ] Uses consistent spacing scale
- [ ] Implements proper focus states
- [ ] Uses semantic HTML elements
- [ ] Includes proper ARIA labels
- [ ] Is responsive across device sizes
- [ ] Uses consistent iconography
- [ ] Follows accessibility guidelines
- [ ] Uses CSS custom properties for colors

---

**Remember**: The goal is to create a consistent, professional, and energy-themed user interface that reflects the WattBrews brand identity while maintaining excellent usability and accessibility.
