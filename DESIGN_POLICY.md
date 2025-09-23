# WattBrews Energy Theme Design Policy

## Overview

This document defines the design system and guidelines for the WattBrews charging station management application. Our design follows an **Energy/Electric** theme that reflects our focus on electric vehicle charging infrastructure.

## Design Principles

### 1. Energy-Focused Brand Identity
- **Primary Theme**: Electric energy and charging infrastructure
- **Visual Language**: Clean, modern, and technology-forward
- **User Experience**: Intuitive, efficient, and reliable
- **Accessibility**: WCAG 2.1 AA compliant

### 2. Consistency First
- All components must follow the established design tokens
- Use utility classes for consistent spacing, colors, and styling
- Maintain visual hierarchy through typography and spacing scales
- Apply consistent interaction patterns across the application

## Color Palette

### Primary Colors
```scss
// Energy Brand Colors (Material 3 Design Tokens)
Primary: mat.$cyan-palette      // Electric blue theme
Secondary: mat.$yellow-palette  // Energy yellow theme  
Tertiary: mat.$blue-palette     // Technology blue theme

// Custom CSS Properties for specific use cases
--energy-cyan: #00bcd4;        // Primary brand color (electric blue)
--energy-cyan-light: #4dd0e1;  // Light variant
--energy-cyan-dark: #0097a7;   // Dark variant

--energy-amber: #ffc107;       // Secondary brand color (energy yellow)
--energy-amber-light: #ffecb3; // Light variant
--energy-amber-dark: #ff8f00;  // Dark variant

--energy-blue: #2196f3;        // Tertiary brand color (electric blue)
--energy-blue-light: #64b5f6;  // Light variant
--energy-blue-dark: #1976d2;   // Dark variant
```

### Neutral Colors
```scss
// Gray Scale for Energy Theme
--energy-gray-50: #f8fafc;     // Lightest background
--energy-gray-100: #f1f5f9;    // Light background
--energy-gray-200: #e2e8f0;    // Border color
--energy-gray-300: #cbd5e1;    // Disabled states
--energy-gray-400: #94a3b8;    // Placeholder text
--energy-gray-500: #64748b;    // Muted text
--energy-gray-600: #475569;    // Secondary text
--energy-gray-700: #334155;    // Primary text (light theme)
--energy-gray-800: #1e293b;    // Dark text
--energy-gray-900: #0f172a;    // Darkest text
```

### Status Colors
```scss
--energy-success: #10b981;     // Green for success states
--energy-warning: #f59e0b;     // Orange for warnings
--energy-error: #ef4444;       // Red for errors
--energy-info: #3b82f6;        // Blue for information
```

## Typography

### Font Stack
```scss
font-family: 'Inter', Roboto, 'Helvetica Neue', sans-serif;
```

### Typography Scale
- **Headline 1**: 2.5rem (40px) / 1.2 line-height / 600 weight
- **Headline 2**: 2rem (32px) / 1.3 line-height / 600 weight
- **Headline 3**: 1.75rem (28px) / 1.4 line-height / 600 weight
- **Headline 4**: 1.5rem (24px) / 1.4 line-height / 500 weight
- **Headline 5**: 1.25rem (20px) / 1.5 line-height / 500 weight
- **Headline 6**: 1.125rem (18px) / 1.6 line-height / 500 weight
- **Body 1**: 1rem (16px) / 1.5 line-height / 400 weight
- **Body 2**: 0.875rem (14px) / 1.5 line-height / 400 weight
- **Caption**: 0.75rem (12px) / 1.4 line-height / 400 weight

## Spacing Scale

```scss
--energy-space-xs: 0.25rem;    // 4px
--energy-space-sm: 0.5rem;     // 8px
--energy-space-md: 1rem;       // 16px
--energy-space-lg: 1.5rem;     // 24px
--energy-space-xl: 2rem;       // 32px
--energy-space-2xl: 3rem;      // 48px
```

## Border Radius Scale

```scss
--energy-radius-sm: 0.375rem;  // 6px
--energy-radius-md: 0.5rem;    // 8px
--energy-radius-lg: 0.75rem;   // 12px
--energy-radius-xl: 1rem;      // 16px
--energy-radius-2xl: 1.5rem;   // 24px
```

## Shadow System

```scss
--energy-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--energy-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--energy-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--energy-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Component Guidelines

### 1. Cards
- **Border Radius**: `var(--energy-radius-xl)` (16px)
- **Shadow**: `var(--energy-shadow-md)`
- **Border**: 1px solid `var(--energy-gray-200)`
- **Background**: White
- **Padding**: Use spacing scale consistently

```scss
.mat-mdc-card {
  border-radius: var(--energy-radius-xl) !important;
  box-shadow: var(--energy-shadow-md) !important;
  border: 1px solid var(--energy-gray-200) !important;
}
```

### 2. Buttons
- **Border Radius**: `var(--energy-radius-lg)` (12px)
- **Font Weight**: 500
- **Text Transform**: None (avoid uppercase)
- **Transitions**: All properties 0.2s ease

#### Button Variants
- **Primary**: Cyan background with white text
- **Secondary**: Amber background with dark text
- **Outlined**: Transparent background with cyan border
- **Text**: Transparent background with cyan text

### 3. Form Fields
- **Border Radius**: `var(--energy-radius-lg)` (12px)
- **Focus State**: Cyan border with subtle shadow
- **Error State**: Red border with error message

### 4. Chips
- **Border Radius**: `var(--energy-radius-xl)` (16px)
- **Font Weight**: 500
- **Status Variants**: Success (green), Warning (orange), Error (red), Info (blue)

### 5. Status Indicators
Use consistent status indicators throughout the application:

```scss
.energy-status-online::before { content: '●'; color: var(--energy-success); }
.energy-status-offline::before { content: '●'; color: var(--energy-error); }
.energy-status-charging::before { content: '⚡'; color: var(--energy-cyan); }
```

## Utility Classes

### Text Colors
- `.energy-text-primary` - Cyan text
- `.energy-text-secondary` - Amber text
- `.energy-text-tertiary` - Blue text
- `.energy-text-success` - Green text
- `.energy-text-warning` - Orange text
- `.energy-text-error` - Red text
- `.energy-text-muted` - Gray text

### Background Colors
- `.energy-bg-primary` - Cyan background
- `.energy-bg-secondary` - Amber background
- `.energy-bg-tertiary` - Blue background
- `.energy-bg-light` - Light gray background

### Spacing
- `.energy-p-{size}` - Padding (xs, sm, md, lg, xl)
- `.energy-m-{size}` - Margin (xs, sm, md, lg, xl)

### Border Radius
- `.energy-rounded-{size}` - Border radius (sm, md, lg, xl, 2xl)

### Shadows
- `.energy-shadow-{size}` - Box shadow (sm, md, lg, xl)

## Icon Guidelines

### Icon Usage
- **Material Icons**: Use Material Design icons consistently
- **Size**: Follow the typography scale (16px, 20px, 24px, 32px)
- **Color**: Use semantic colors (primary, secondary, status colors)
- **Spacing**: 8px gap between icon and text

### Energy-Specific Icons
- `ev_station` - Charging stations
- `battery_charging_full` - Charging status
- `electrical_services` - Electrical connections
- `flash_on` - Energy/power
- `location_on` - Location/address
- `schedule` - Time-based features

## Layout Guidelines

### Grid System
- Use CSS Grid or Flexbox for layouts
- Maintain consistent spacing using the spacing scale
- Ensure responsive design for mobile, tablet, and desktop

### Container Widths
- **Mobile**: Full width with 16px padding
- **Tablet**: Max-width 768px with 24px padding
- **Desktop**: Max-width 1200px with 32px padding

### Navigation
- **Toolbar**: Cyan background with white text
- **Sidebar**: White background with gray borders
- **Active States**: Cyan accent color

## Accessibility Guidelines

### Color Contrast
- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text
- Test with color blindness simulators

### Focus States
- All interactive elements must have visible focus indicators
- Use cyan color for focus states
- Ensure keyboard navigation works properly

### Screen Readers
- Use semantic HTML elements
- Provide meaningful alt text for images
- Use ARIA labels where appropriate

## Implementation Guidelines

### 1. CSS Custom Properties
Always use CSS custom properties (variables) for colors, spacing, and other design tokens:

```scss
// ✅ Good
color: var(--energy-cyan);
padding: var(--energy-space-md);

// ❌ Bad
color: #00bcd4;
padding: 16px;
```

### 2. Component Styling
- Use Angular Material components as the base
- Apply energy theme overrides in global styles
- Use utility classes for quick styling
- Avoid inline styles

### 3. Responsive Design
- Mobile-first approach
- Use CSS Grid and Flexbox
- Test on multiple device sizes
- Ensure touch targets are at least 44px

### 4. Performance
- Minimize custom CSS
- Use CSS custom properties for theming
- Optimize images and icons
- Follow Angular best practices

## Quality Checklist

Before implementing any component, ensure:

- [ ] Uses design system tokens (colors, spacing, typography)
- [ ] Follows accessibility guidelines
- [ ] Is responsive across device sizes
- [ ] Uses semantic HTML
- [ ] Has proper focus states
- [ ] Uses consistent iconography
- [ ] Follows the energy theme branding
- [ ] Has appropriate hover and active states
- [ ] Uses utility classes where appropriate
- [ ] Is tested with screen readers

## Future Considerations

### Dark Mode
The design system is prepared for dark mode implementation:
- Use CSS custom properties for all colors
- Test contrast ratios in both themes
- Consider user preferences and system settings

### Brand Evolution
- Document any brand changes in this policy
- Update color palette and guidelines as needed
- Maintain backward compatibility where possible

## Resources

- [Angular Material Design Guidelines](https://material.angular.dev/)
- [Material Design 3 Guidelines](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font Family](https://rsms.me/inter/)

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: Development Team
