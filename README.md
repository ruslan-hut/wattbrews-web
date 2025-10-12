# WattBrews Web Application

**Modern Angular web application for electric vehicle charging station management**

## 📋 Overview

WattBrews is a comprehensive platform for managing EV charging infrastructure, providing real-time monitoring, transaction management, and user-friendly interfaces for both administrators and end-users.

### Key Features

- **Real-Time Monitoring**: Live updates via WebSocket for charge point status and transactions
- **Multi-Language Support**: Full internationalization (English/Spanish)
- **Modern UI/UX**: Material Design 3 with custom Energy theme
- **Firebase Authentication**: Secure user authentication and authorization
- **Progressive Web App**: Installable with offline capabilities
- **Responsive Design**: Mobile-first approach with tablet and desktop support

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Angular CLI 20.x

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Copy environment configuration
cp env.example src/environments/environment.development.ts

# Start development server
npm start
```

The application will be available at `http://localhost:4200/`

### Build for Production

```bash
# Build the application
npm run build

# Output will be in dist/wattbrews-web/browser/
```

## 🏗️ Tech Stack

- **Framework**: Angular 20.3
- **UI Library**: Angular Material 20.2
- **State Management**: Angular Signals
- **Authentication**: Firebase Auth 11.10
- **Real-Time Communication**: WebSocket
- **Maps**: Leaflet 1.9
- **Language**: TypeScript 5.9
- **Styling**: SCSS with Material Design 3
- **PWA**: Angular Service Worker

## 📚 Documentation

### Core Documentation

- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Overview of key features and implementation details
- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment configuration and setup instructions

### Design System

- **[Design Policy](./DESIGN_POLICY.md)** - Design system guidelines, color palette, typography, and component patterns
- **[Design Examples](./DESIGN_EXAMPLES.md)** - Practical examples of implementing the Energy theme in components

### WebSocket Integration

- **[WebSocket Technical Guide](./WEBSOCKET_TECHNICAL_GUIDE.md)** - Complete guide for integrating WebSocket in components
- **[WebSocket Description](./WEBSOCKET_DESCRIPTION.md)** - Backend WebSocket API specification
- **[Charge Point Updates](./CHARGE_POINT_UPDATES.md)** - Detailed documentation for real-time charge point updates
- **[Charge Point Updates Quick Reference](./CHARGE_POINT_UPDATES_QUICK_REFERENCE.md)** - Quick reference for developers

### Feature Implementation

- **[Transaction Start Implementation](./TRANSACTION_START_IMPLEMENTATION.md)** - Transaction start flow implementation guide
- **[Translation Service Technical Guide](./TRANSLATION_SERVICE_TECHNICAL_GUIDE.md)** - Internationalization implementation guide

## 🏃 Development

### Development Server

```bash
# Start dev server with hot reload
npm start

# Start on specific port
ng serve --port 4300

# Start with production configuration
ng serve --configuration production
```

### Code Generation

```bash
# Generate a new component
ng generate component features/my-feature

# Generate a new service
ng generate service core/services/my-service

# Generate a new guard
ng generate guard core/guards/my-guard
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode
ng test --browsers=ChromeHeadless --watch=false
```

### Code Quality

```bash
# Format code with Prettier
npx prettier --write .

# Lint TypeScript files
ng lint
```

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                    # Core functionality
│   │   ├── constants/           # Application constants
│   │   ├── guards/              # Route guards
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── models/              # Data models and interfaces
│   │   └── services/            # Core services
│   ├── features/                # Feature modules
│   │   ├── auth/                # Authentication features
│   │   ├── dashboard/           # Dashboard
│   │   ├── profile/             # User profile
│   │   ├── sessions/            # Charging sessions
│   │   ├── stations/            # Charging stations
│   │   └── tools/               # Admin tools
│   ├── layouts/                 # Layout components
│   │   ├── auth-layout/         # Authentication layout
│   │   └── main-layout/         # Main application layout
│   ├── shared/                  # Shared components and utilities
│   │   ├── components/          # Reusable components
│   │   └── utils/               # Utility functions
│   ├── app.ts                   # Root component
│   ├── app.config.ts            # Application configuration
│   └── app.routes.ts            # Application routes
├── assets/                      # Static assets
│   └── i18n/                    # Translation files
├── environments/                # Environment configurations
└── styles.scss                  # Global styles
```

## 🎨 Design System

The application follows an **Energy/Electric theme** with Material Design 3 principles:

- **Primary Color**: Cyan (#00bcd4) - Electric blue theme
- **Secondary Color**: Amber (#ffc107) - Energy yellow theme
- **Tertiary Color**: Blue (#2196f3) - Technology blue theme

See [Design Policy](./DESIGN_POLICY.md) for complete design system documentation.

## 🌐 Internationalization

The application supports multiple languages with reactive translation updates:

- **English** (en)
- **Spanish** (es)

Translation files are located in `public/assets/i18n/`. See [Translation Service Technical Guide](./TRANSLATION_SERVICE_TECHNICAL_GUIDE.md) for implementation details.

## 🔒 Authentication

Firebase Authentication is used for secure user management:

- Email/Password authentication
- Email verification
- Password reset functionality
- Role-based access control

## 📡 Real-Time Updates

WebSocket connection provides real-time updates for:

- Charge point status changes
- Transaction progress
- Connector availability
- System events and logs

See [WebSocket Technical Guide](./WEBSOCKET_TECHNICAL_GUIDE.md) for integration details.

## 🚀 Deployment

The application can be deployed to any static hosting service:

1. Build the production bundle: `npm run build`
2. Deploy the contents of `dist/wattbrews-web/browser/` to your server
3. Configure your web server (see `nginx.conf` for Nginx example)

See [Deployment Guide](./DEPLOYMENT.md) for detailed deployment instructions including GitHub Actions setup.

## 🔧 Environment Configuration

Create environment files based on `env.example`:

**Development**: `src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000',
  wsBaseUrl: 'ws://localhost:8000/ws',
  firebase: {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    projectId: "your-project-id",
    // ... other Firebase config
  }
};
```

**Production**: `src/environments/environment.ts`
```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.yourapp.com',
  wsBaseUrl: 'wss://api.yourapp.com/ws',
  firebase: {
    // Production Firebase config
  }
};
```

## 📦 Key Dependencies

- `@angular/core` ^20.3.0 - Angular framework
- `@angular/material` ^20.2.3 - Material Design components
- `@angular/fire` ^20.0.1 - Firebase integration
- `firebase` ^11.10.0 - Firebase SDK
- `leaflet` ^1.9.4 - Interactive maps
- `rxjs` ~7.8.0 - Reactive programming

## 🤝 Contributing

1. Follow Angular style guide and best practices
2. Use standalone components (no NgModules)
3. Implement OnPush change detection
4. Use signals for state management
5. Write comprehensive documentation
6. Test your changes thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

For issues, questions, or contributions:

- Check the [documentation](#-documentation) first
- Review existing issues in the repository
- Create a new issue with detailed description

## 🔗 Useful Links

- [Angular Documentation](https://angular.dev/)
- [Angular Material](https://material.angular.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Material Design 3](https://m3.material.io/)

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Angular Version**: 20.3
