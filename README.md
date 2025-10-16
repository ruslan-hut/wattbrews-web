# WattBrews Web Application

A modern, enterprise-grade Progressive Web Application (PWA) for managing electric vehicle charging station infrastructure. Built with Angular 20, Firebase, and Material Design, WattBrews provides real-time monitoring, user management, and comprehensive session tracking for EV charging networks.

## 🚀 Project Overview

**WattBrews** is a web-based platform designed to streamline the management and monitoring of electric vehicle (EV) charging stations. It enables operators to track charging sessions in real-time, manage user access, monitor station health, and analyze usage patterns through an intuitive, mobile-friendly interface.

### Key Features

- **🔌 Real-time Station Monitoring**: Track charging station status, power output, and availability with live WebSocket updates
- **📊 Session Management**: View detailed charging session history with comprehensive metrics and analytics
- **👥 User Authentication & Authorization**: Secure Firebase-based authentication with role-based access control (RBAC)
- **🗺️ Interactive Map Integration**: Visualize charging station locations using Leaflet maps
- **🌍 Internationalization (i18n)**: Multi-language support (English & Spanish) with reactive translation system
- **📱 Progressive Web App (PWA)**: Installable, offline-capable application with service worker support
- **🎨 Material Design 3**: Modern, accessible UI with custom Energy/Electric theme
- **🔒 Enterprise Security**: Firebase App Check, API key restrictions, and comprehensive security measures
- **♿ Accessibility**: WCAG 2.1 AA compliant components and navigation

## 🏗️ Architecture & Technology Stack

### Frontend Framework
- **Angular 20** - Latest standalone component architecture with signals-based reactive state management
- **TypeScript 5.9** - Strict type checking for enhanced code quality and maintainability
- **RxJS 7.8** - Reactive programming for asynchronous data streams

### UI Components & Styling
- **Angular Material 20** - Material Design components with custom theming
- **Material Design 3** - Modern design system with energy-focused brand identity
- **Responsive Design** - Mobile-first approach with flexible layouts

### Backend & Data
- **Firebase Authentication** - Secure user authentication and session management
- **Firebase Firestore** - NoSQL cloud database for real-time data synchronization
- **Firebase App Check** - Application attestation and anti-abuse protection
- **WebSocket Integration** - Real-time updates for charging session monitoring

### Mapping & Visualization
- **Leaflet.js** - Interactive maps for station location visualization
- **Angular CDK** - Component development kit for advanced UI patterns

### Build & Development Tools
- **Angular CLI 20** - Development server, build optimization, and code generation
- **ESLint** - Code quality and consistency enforcement
- **Prettier** - Automated code formatting
- **Karma + Jasmine** - Unit testing framework

### DevOps & Deployment
- **GitHub Actions** - CI/CD pipeline for automated builds and deployments
- **Nginx** - Production web server configuration
- **Service Workers** - Offline functionality and caching strategies

## 🎯 Core Implementation Details

### State Management
- **Signals** for local component state (Angular's built-in reactive primitives)
- **Computed signals** for derived state calculations
- **Services** with `providedIn: 'root'` for application-wide state

### Component Architecture
- **Standalone Components** - No NgModules, modern Angular architecture
- **OnPush Change Detection** - Optimized rendering performance
- **Input/Output Functions** - Type-safe component communication
- **Smart/Presentational Pattern** - Clear separation of concerns

### Security Architecture
1. **Environment Variable System** - Credentials stored in `.env`, never committed to git
2. **Firebase App Check** - reCAPTCHA v3 integration for request verification
3. **API Key Restrictions** - Domain-based limitations on Firebase API usage
4. **Pre-commit Hooks** - Automated secret scanning before git commits
5. **Role-based Access Control** - Protected routes with authentication guards

### Translation System
- **Custom Translation Service** - Lightweight, reactive i18n implementation
- **Async Loading** - Proper translation initialization before component render
- **Signal-based Reactivity** - Automatic UI updates on language changes
- **JSON Translation Files** - Easy-to-manage language resources

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Git** (v2.x or higher)
- **Angular CLI** (v20.x) - Optional but recommended

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ruslan-hut/wattbrews-web.git
cd wattbrews-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
# Copy the environment template
cp env.example .env

# Edit .env with your Firebase credentials
nano .env  # or use your preferred editor
```

**Required environment variables:**
- `FIREBASE_API_KEY` - Firebase Web API Key
- `FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `FIREBASE_PROJECT_ID` - Firebase Project ID
- `FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `FIREBASE_APP_ID` - Firebase App ID
- `FIREBASE_MEASUREMENT_ID` - Firebase Measurement ID (Analytics)
- `RECAPTCHA_SITE_KEY` - reCAPTCHA v3 Site Key (for App Check)
- `API_BASE_URL` - Backend API Base URL (optional)
- `WS_BASE_URL` - WebSocket Base URL (optional)

> **Security Note**: Never commit `.env` files to version control. See [Environment Configuration Guide](src/environments/README.md) for details.

### 4. Generate Environment Files

```bash
# For development
npm run config:dev

# For production
npm run config:prod
```

### 5. Start Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you change source files.

## 🛠️ Development Workflow

### Available Commands

```bash
# Development server
npm start                 # Runs config:dev then ng serve

# Build commands
npm run build             # Production build
npm run watch             # Development build with watch mode

# Testing
npm test                  # Run unit tests

# Code quality
npm run lint              # Run ESLint
npm run format            # Format code with Prettier

# Environment setup
npm run config:dev        # Generate development environment files
npm run config:prod       # Generate production environment files
```

### Project Structure

```
wattbrews-web/
├── src/
│   ├── app/
│   │   ├── core/              # Core services, guards, interceptors, models
│   │   │   ├── constants/     # Application constants
│   │   │   ├── guards/        # Route guards (auth, role-based)
│   │   │   ├── interceptors/  # HTTP interceptors
│   │   │   ├── models/        # TypeScript interfaces and types
│   │   │   └── services/      # Singleton services
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/          # Authentication (login, register, etc.)
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── profile/       # User profile management
│   │   │   ├── sessions/      # Charging session management
│   │   │   └── stations/      # Station management
│   │   ├── layouts/           # Application layouts
│   │   │   ├── auth-layout/   # Layout for auth pages
│   │   │   └── main-layout/   # Main application layout
│   │   ├── shared/            # Shared components and utilities
│   │   │   ├── components/    # Reusable UI components
│   │   │   └── utils/         # Utility functions
│   │   ├── app.config.ts      # Application configuration
│   │   ├── app.routes.ts      # Route definitions
│   │   └── app.ts             # Root component
│   ├── assets/                # Static assets
│   │   └── i18n/              # Translation files
│   ├── environments/          # Environment configurations
│   └── styles.scss            # Global styles
├── public/                    # Public assets
├── scripts/                   # Build and utility scripts
├── dist/                      # Build output
└── docs/                      # Documentation (see below)
```

### Code Scaffolding

Generate new components using Angular CLI:

```bash
# Generate a component
ng generate component features/feature-name/component-name

# Generate a service
ng generate service core/services/service-name

# Generate a guard
ng generate guard core/guards/guard-name

# For help
ng generate --help
```

### Coding Standards

- **TypeScript**: Strict type checking enabled, avoid `any` type
- **Components**: Always use standalone components with OnPush change detection
- **State**: Use signals for reactive state management
- **Styling**: Separate CSS files, use utility classes from design system
- **Templates**: Use control flow syntax (`@if`, `@for`, `@switch`)
- **Formatting**: Code is auto-formatted with Prettier (100-character line width)

## 🔒 Security Best Practices

### Critical Security Rules

✅ **DO:**
- Store credentials in `.env` file (never commit it)
- Use environment variables in CI/CD pipelines
- Install pre-commit hooks: `./scripts/install-hooks.sh`
- Keep API keys restricted to specific domains
- Enable Firebase App Check in production

❌ **DON'T:**
- Commit `.env` file to version control
- Hardcode API keys anywhere in code
- Share credentials via email or chat
- Disable security hooks or checks

### Git Hooks

Install the pre-commit hook to prevent accidental credential commits:

```bash
./scripts/install-hooks.sh
```

This hook automatically scans for:
- Firebase API keys
- reCAPTCHA keys
- Auth tokens
- Private keys

## 🌐 Deployment

### Production Build

```bash
# Generate production environment files
npm run config:prod

# Build for production
npm run build
```

The build artifacts will be stored in the `dist/wattbrews-web/browser/` directory.

### Automated Deployment

The project includes GitHub Actions workflow for automated deployment. See [Deployment Guide](DEPLOYMENT.md) for configuration details.

### Server Configuration

Example Nginx configuration is provided in `nginx.conf`. Key requirements:
- Serve `index.html` for all routes (Angular routing)
- Set proper cache headers for static assets
- Enable gzip compression
- Configure SSL/TLS certificates

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in headless mode (CI)
npm run test:ci
```

Unit tests are written using Jasmine and executed via Karma.

## 📚 Documentation

This project includes comprehensive documentation for various aspects of the application:

### Quick Start & Reference
- **[Quick Reference Card](QUICK_REFERENCE.md)** - Essential commands, troubleshooting, and daily workflow
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Overview of implemented features and security measures

### Configuration & Setup
- **[Environment Configuration](src/environments/README.md)** - Detailed guide for environment variable setup
- **[Deployment Guide](DEPLOYMENT.md)** - CI/CD configuration and server setup instructions

### Design & Development
- **[Design Policy](DESIGN_POLICY.md)** - Design system guidelines, color palette, and component standards
- **[Design Examples](DESIGN_EXAMPLES.md)** - Practical examples of implementing the design system
- **[Translation Service Guide](TRANSLATION_SERVICE_TECHNICAL_GUIDE.md)** - Internationalization implementation details

### Security
- All documentation includes security considerations
- Pre-commit hooks prevent credential leaks
- See [Implementation Summary](IMPLEMENTATION_SUMMARY.md) for security architecture

## 🤝 Contributing

### Development Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow coding standards** defined in the project
3. **Write tests** for new features
4. **Update documentation** as needed
5. **Run linters** before committing
6. **Create pull requests** with clear descriptions

### Commit Message Format

Follow conventional commits:

```
feat: add station filtering functionality
fix: resolve authentication redirect issue
docs: update deployment guide
style: format code with prettier
refactor: simplify session service logic
test: add unit tests for auth guard
```

### Code Review Process

- All changes require review before merging
- Automated tests must pass
- Code must meet linting standards
- Documentation must be updated

## 🆘 Support & Troubleshooting

### Common Issues

**"PLACEHOLDER" error in console**
```bash
# Environment files not generated
npm run config:dev
```

**"FIREBASE_API_KEY is required" error**
```bash
# .env file missing or incomplete
cp env.example .env
# Edit .env with your credentials
```

**Build fails with environment errors**
```
# Environment variables not set in CI/CD
# Add secrets in your CI/CD platform
```

See [Quick Reference](QUICK_REFERENCE.md) for more troubleshooting tips.

### Getting Help

1. Check the [Quick Reference](QUICK_REFERENCE.md) for common issues
2. Review relevant documentation (see [Documentation](#documentation) section)
3. Search existing GitHub issues
4. Create a new issue with detailed information

## 📄 License

This project is private and proprietary. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

## 👥 Team

- **Project Lead**: Ruslan Hut
- **Repository**: [github.com/ruslan-hut/wattbrews-web](https://github.com/ruslan-hut/wattbrews-web)

## 🔗 Related Resources

- [Angular Documentation](https://angular.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Material Design](https://material.angular.io)
- [Leaflet Documentation](https://leafletjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Built with ❤️ for the future of electric mobility**
