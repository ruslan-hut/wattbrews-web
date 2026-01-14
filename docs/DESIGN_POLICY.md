# WattBrews Energy Theme Design Policy

## Overview

This document defines the design system and guidelines for the WattBrews charging station management application. Our design follows a modern **Purple/Teal** theme that reflects innovation in electric vehicle charging infrastructure.

## Design Principles

### 1. Energy-Focused Brand Identity
- **Primary Theme**: Modern tech with electric energy focus
- **Visual Language**: Clean, modern, and technology-forward
- **User Experience**: Intuitive, efficient, and reliable
- **Accessibility**: WCAG 2.1 AA compliant

### 2. Consistency First
- All components must follow the established design tokens
- Use CSS custom properties for all colors, spacing, and typography
- Maintain visual hierarchy through typography and spacing scales
- Apply consistent interaction patterns across the application

## Color Palette

### Primary Colors (Purple Tech)
```scss
--energy-primary: #8b5cf6;         // Main purple
--energy-primary-light: #a78bfa;   // Light variant
--energy-primary-lighter: #c4b5fd; // Lighter variant
--energy-primary-dark: #7c3aed;    // Dark variant
--energy-primary-darker: #6d28d9;  // Darker variant
--energy-primary-50: #f5f3ff;      // Background tint
--energy-primary-100: #ede9fe;     // Light background
--energy-primary-900: #4c1d95;     // Darkest
```

### Secondary Colors (Teal Accent)
```scss
--energy-secondary: #14b8a6;         // Main teal
--energy-secondary-light: #2dd4bf;   // Light variant
--energy-secondary-lighter: #5eead4; // Lighter variant
--energy-secondary-dark: #0d9488;    // Dark variant
--energy-secondary-darker: #0f766e;  // Darker variant
--energy-secondary-50: #f0fdfa;      // Background tint
--energy-secondary-100: #ccfbf1;     // Light background
--energy-secondary-900: #134e4a;     // Darkest
```

### Tertiary Colors (Indigo)
```scss
--energy-tertiary: #6366f1;        // Main indigo
--energy-tertiary-light: #818cf8;  // Light variant
--energy-tertiary-dark: #4f46e5;   // Dark variant
--energy-tertiary-50: #eef2ff;     // Background tint
```

### Neutral Colors (Gray Scale)
```scss
--energy-gray-50: #fafafa;   // Lightest
--energy-gray-100: #f4f4f5;  // Light background
--energy-gray-200: #e4e4e7;  // Borders
--energy-gray-300: #d4d4d8;  // Disabled borders
--energy-gray-400: #a1a1aa;  // Placeholder text
--energy-gray-500: #71717a;  // Muted text
--energy-gray-600: #52525b;  // Secondary text
--energy-gray-700: #3f3f46;  // Primary text (dark mode)
--energy-gray-800: #27272a;  // Dark surfaces
--energy-gray-900: #18181b;  // Darkest surfaces
--energy-gray-950: #09090b;  // Near black
```

### Status Colors
```scss
--energy-success: #10b981;       // Green for success
--energy-success-light: #d1fae5; // Light green background
--energy-success-dark: #059669;  // Dark green text

--energy-warning: #f59e0b;       // Orange for warnings
--energy-warning-light: #fef3c7; // Light orange background
--energy-warning-dark: #d97706;  // Dark orange text

--energy-error: #ef4444;         // Red for errors
--energy-error-light: #fee2e2;   // Light red background
--energy-error-dark: #dc2626;    // Dark red text

--energy-info: #3b82f6;          // Blue for information
--energy-info-light: #dbeafe;    // Light blue background
--energy-info-dark: #2563eb;     // Dark blue text
```

### Semantic Theme Colors

These colors automatically switch between light and dark mode:

```scss
// Surfaces
--energy-surface: #ffffff;                    // Card backgrounds
--energy-surface-variant: var(--energy-gray-50);  // Alternate surfaces
--energy-surface-elevated: #ffffff;           // Elevated elements
--energy-surface-container: var(--energy-gray-100);

// Backgrounds
--energy-background: var(--energy-gray-50);   // Page background
--energy-background-subtle: var(--energy-gray-100);

// Text
--energy-text-primary: var(--energy-gray-900);   // Main text
--energy-text-secondary: var(--energy-gray-600); // Secondary text
--energy-text-muted: var(--energy-gray-500);     // Muted/hint text
--energy-text-disabled: var(--energy-gray-400);  // Disabled text

// Borders
--energy-border: var(--energy-gray-200);        // Default borders
--energy-border-subtle: var(--energy-gray-100); // Subtle borders
--energy-border-strong: var(--energy-gray-300); // Strong borders
```

## Typography

### Font Families

The application uses two font families for visual hierarchy:

```scss
// Display font for headings and titles
--font-family-display: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;

// Body font for text, labels, and UI elements
--font-family-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Usage Guidelines

| Element | Font Family | Weight | Letter Spacing |
|---------|-------------|--------|----------------|
| Page titles | `--font-family-display` | 600 | -0.03em |
| Card titles | `--font-family-display` | 600 | -0.02em |
| Section headers | `--font-family-display` | 600 | -0.02em |
| Body text | `--font-family-body` | 400 | normal |
| Labels | `--font-family-body` | 500 | normal |
| Buttons | `--font-family-body` | 500 | normal |
| Form inputs | `--font-family-body` | 400 | normal |
| Captions | `--font-family-body` | 400 | normal |

### Font Size Scale (Responsive)

```scss
--font-size-xs: 0.75rem;                              // 12px
--font-size-sm: 0.875rem;                             // 14px
--font-size-base: 1rem;                               // 16px
--font-size-lg: 1.125rem;                             // 18px
--font-size-xl: clamp(1.25rem, 1rem + 1.25vw, 1.5rem);    // 20-24px
--font-size-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);   // 24-32px
--font-size-3xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);       // 32-48px
```

## Spacing Scale

```scss
--energy-space-xs: 0.25rem;   // 4px
--energy-space-sm: 0.5rem;    // 8px
--energy-space-md: 1rem;      // 16px
--energy-space-lg: 1.5rem;    // 24px
--energy-space-xl: 2rem;      // 32px
--energy-space-2xl: 3rem;     // 48px
--energy-space-3xl: 4rem;     // 64px
```

## Border Radius Scale

```scss
--energy-radius-xs: 0.375rem;  // 6px
--energy-radius-sm: 0.5rem;    // 8px
--energy-radius-md: 0.75rem;   // 12px
--energy-radius-lg: 1rem;      // 16px
--energy-radius-xl: 1.25rem;   // 20px
--energy-radius-2xl: 1.5rem;   // 24px
--energy-radius-3xl: 2rem;     // 32px
--energy-radius-full: 9999px;  // Pill shape
```

## Shadow System

### Light Mode Shadows
```scss
--energy-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--energy-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
--energy-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
--energy-shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05);
--energy-shadow-xl: 0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06);
--energy-shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
```

### Glow Effects
```scss
--energy-glow-primary: 0 0 20px rgba(139, 92, 246, 0.3);
--energy-glow-secondary: 0 0 20px rgba(20, 184, 166, 0.3);
```

## Dark Theme

Dark theme is activated via `data-theme="dark"` attribute on the `<html>` element.

### Dark Mode Color Overrides
```scss
[data-theme="dark"] {
  // Surfaces
  --energy-surface: var(--energy-gray-900);
  --energy-surface-variant: var(--energy-gray-800);
  --energy-surface-elevated: var(--energy-gray-800);
  --energy-background: var(--energy-gray-950);

  // Text (inverted)
  --energy-text-primary: var(--energy-gray-50);
  --energy-text-secondary: var(--energy-gray-300);
  --energy-text-muted: var(--energy-gray-500);

  // Borders (darker)
  --energy-border: var(--energy-gray-700);
  --energy-border-subtle: var(--energy-gray-800);

  // Primary colors (brighter for visibility)
  --energy-primary: #a78bfa;
  --energy-primary-dark: #8b5cf6;

  // Status colors (adjusted for dark backgrounds)
  --energy-success-light: rgba(16, 185, 129, 0.25);
  --energy-warning-light: rgba(245, 158, 11, 0.25);
  --energy-error-light: rgba(239, 68, 68, 0.25);
  --energy-info-light: rgba(59, 130, 246, 0.25);
}
```

## Glassmorphism Effects

```scss
--energy-glass-bg: rgba(255, 255, 255, 0.8);
--energy-glass-bg-light: rgba(255, 255, 255, 0.6);
--energy-glass-bg-heavy: rgba(255, 255, 255, 0.95);
--energy-glass-border: rgba(255, 255, 255, 0.2);
--energy-blur-sm: blur(4px);
--energy-blur-md: blur(8px);
--energy-blur-lg: blur(16px);
```

## Gradients

```scss
--energy-gradient-primary: linear-gradient(135deg, var(--energy-primary) 0%, var(--energy-tertiary) 100%);
--energy-gradient-hero: linear-gradient(135deg, var(--energy-primary) 0%, var(--energy-primary-dark) 100%);
--energy-gradient-hero-soft: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
```

## Component Guidelines

### 1. Page Headers

All pages should have centered titles with consistent styling:

```scss
.page-header {
  text-align: center;
  margin-bottom: var(--energy-space-2xl);
}

// For detail pages with back button
.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.back-button {
  position: absolute;
  left: 0;
}

.page-title {
  font-family: var(--font-family-display);
  font-size: var(--font-size-3xl);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--energy-text-primary);
}

.page-subtitle {
  font-family: var(--font-family-body);
  font-size: var(--font-size-lg);
  color: var(--energy-text-secondary);
}
```

### 2. Cards

```scss
.mat-mdc-card {
  border-radius: var(--energy-radius-xl);
  box-shadow: var(--energy-shadow-elevated);
  border: 1px solid var(--energy-border-subtle);
  background-color: var(--energy-surface);
}

.mat-mdc-card-title {
  font-family: var(--font-family-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.mat-mdc-card-subtitle {
  font-family: var(--font-family-body);
}
```

### 3. Buttons

```scss
// All buttons use body font
.mat-mdc-button, .mat-mdc-raised-button, .mat-mdc-flat-button {
  font-family: var(--font-family-body);
  font-weight: 500;
  border-radius: var(--energy-radius-lg);
  text-transform: none;
}

// Primary button style
.energy-button-primary {
  background: var(--energy-gradient-primary);
  color: white;
}

// Outlined button style
.energy-button-outlined {
  border: 2px solid var(--energy-primary);
  color: var(--energy-primary);
  background: transparent;

  &:hover {
    background: var(--energy-primary);
    color: white;
  }
}
```

### 4. Form Fields

```scss
.mat-mdc-form-field {
  font-family: var(--font-family-body);
}

.mat-mdc-floating-label {
  font-family: var(--font-family-body);
}
```

### 5. Dialogs

```scss
.mat-mdc-dialog-container .mdc-dialog__surface {
  background-color: var(--energy-surface);
  border-radius: var(--energy-radius-2xl);
}
```

### 6. Snackbars

```scss
.mat-mdc-snack-bar-container {
  --mdc-snackbar-container-color: var(--energy-gray-900);
  --mdc-snackbar-supporting-text-color: var(--energy-gray-50);
  --mdc-snackbar-supporting-text-font: var(--font-family-body);
}
```

### 7. Tooltips

```scss
.mat-mdc-tooltip {
  --mdc-plain-tooltip-container-color: var(--energy-gray-900);
  --mdc-plain-tooltip-supporting-text-color: var(--energy-gray-50);
  --mdc-plain-tooltip-supporting-text-font: var(--font-family-body);
  --mdc-plain-tooltip-supporting-text-size: var(--font-size-xs);
}
```

### 8. Status Chips

```scss
.energy-chip-success {
  background-color: var(--energy-success-light);
  color: var(--energy-success-dark);
}

.energy-chip-warning {
  background-color: var(--energy-warning-light);
  color: var(--energy-warning-dark);
}

.energy-chip-error {
  background-color: var(--energy-error-light);
  color: var(--energy-error-dark);
}

.energy-chip-info {
  background-color: var(--energy-info-light);
  color: var(--energy-info-dark);
}
```

## Icon Guidelines

### Icon Usage
- **Material Icons**: Use Material Design icons consistently
- **Sizes**: 16px (inline), 20px (small), 24px (default), 32px (large)
- **Color**: Use semantic colors (primary, secondary, status)
- **Spacing**: `var(--energy-space-sm)` gap between icon and text

### Energy-Specific Icons
- `ev_station` - Charging stations
- `battery_charging_full` - Charging status
- `electrical_services` - Electrical connections
- `flash_on` - Energy/power
- `location_on` - Location/address
- `schedule` - Time-based features
- `system_update` - App updates

## Layout Guidelines

### Container Widths
```scss
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1400px;
```

### Responsive Breakpoints
```scss
--breakpoint-xs: 480px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Grid System
- Use CSS Grid or Flexbox for layouts
- Maintain consistent spacing using the spacing scale
- Mobile-first responsive design

## Accessibility Guidelines

### Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Test with color blindness simulators

### Focus States
- All interactive elements must have visible focus indicators
- Use primary color for focus outlines
- Ensure keyboard navigation works properly

### Touch Targets
- Minimum 44px for touch targets on mobile
- Adequate spacing between interactive elements

## Implementation Guidelines

### 1. Always Use CSS Variables
```scss
// ✅ Good
color: var(--energy-primary);
padding: var(--energy-space-md);
font-family: var(--font-family-display);
border-radius: var(--energy-radius-lg);

// ❌ Bad
color: #8b5cf6;
padding: 16px;
font-family: 'Space Grotesk';
border-radius: 16px;
```

### 2. Font Family Usage
```scss
// ✅ Headings and titles
h1, h2, h3, .page-title, .card-title {
  font-family: var(--font-family-display);
}

// ✅ Body text and UI elements
p, span, label, button, input {
  font-family: var(--font-family-body);
}
```

### 3. Component Styling
- Use Angular Material components as the base
- Apply theme overrides in global `styles.scss`
- Component-specific styles in component SCSS files
- Avoid inline styles

### 4. Responsive Design
- Mobile-first approach
- Use CSS Grid and Flexbox
- Test on multiple device sizes
- Use responsive font sizes with `clamp()`

## Quality Checklist

Before implementing any component, ensure:

- [ ] Uses design system tokens (colors, spacing, typography)
- [ ] Uses correct font family (display for headings, body for text)
- [ ] Follows accessibility guidelines
- [ ] Is responsive across device sizes
- [ ] Works in both light and dark modes
- [ ] Has proper focus states
- [ ] Uses consistent iconography
- [ ] Has appropriate hover and active states

## Resources

- [Angular Material Design Guidelines](https://material.angular.dev/)
- [Material Design 3 Guidelines](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font Family](https://rsms.me/inter/)
- [Space Grotesk Font Family](https://fonts.google.com/specimen/Space+Grotesk)

---

**Version**: 2.0
**Last Updated**: January 2026
