# Quick Reference Card

## 🚀 Getting Started (New Team Member)

```bash
# 1. Clone the repository
git clone https://github.com/ruslan-hut/wattbrews-web.git
cd wattbrews-web

# 2. Install dependencies
npm install

# 3. Set up environment
cp env.example .env
# Edit .env and add your Firebase credentials

# 4. Install git hooks (optional but recommended)
./scripts/install-hooks.sh

# 5. Start development
npm start
```

## 🔧 Daily Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Generate environment files manually
npm run config:dev    # Development
npm run config:prod   # Production
```

## 📁 Important Files

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env` | Your local credentials | ❌ NO |
| `env.example` | Template for .env | ✅ YES |
| `src/environments/*.ts` | Auto-generated config | ✅ YES (with placeholders) |
| `scripts/set-env.js` | Generates environment files | ✅ YES |

## 🔐 Security Rules

### ✅ DO
- Store credentials in `.env` file locally
- Use environment variables in CI/CD
- Keep placeholders in committed environment files
- Add restrictions to Firebase API keys
- Use Firebase App Check

### ❌ DON'T
- Commit `.env` file
- Hardcode API keys in code
- Share credentials in chat/email
- Push real credentials to git
- Disable the pre-commit hook

## 🆘 Common Issues

### "PLACEHOLDER" error in console
**Problem**: Environment files not generated
```bash
# Solution:
npm run config:dev
```

### "FIREBASE_API_KEY is required" error
**Problem**: .env file missing or incomplete
```bash
# Solution:
cp env.example .env
# Edit .env and add your Firebase API key
```

### Build fails with environment errors
**Problem**: Environment variables not set in CI/CD
```
# Solution: Add secrets in your CI/CD platform:
FIREBASE_API_KEY
RECAPTCHA_SITE_KEY
# ... etc (see env.example)
```

### App Check errors in production
**Problem**: reCAPTCHA not configured
```
# Solution: 
1. Set up reCAPTCHA v3 in Firebase Console
2. Add RECAPTCHA_SITE_KEY to your environment
```

## 🔑 Where to Find Credentials

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click Settings (⚙️) → Project Settings
4. Scroll to "Your apps" section
5. Find your web app
6. Copy the config values to `.env`

### reCAPTCHA Site Key
1. Go to Firebase Console → App Check
2. Select your web app
3. Click "Register" next to reCAPTCHA
4. Get the site key from [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)

## 🌐 Environment Variables Reference

```bash
# Firebase (required)
FIREBASE_API_KEY=              # From Firebase Console
FIREBASE_AUTH_DOMAIN=          # Usually: project-id.firebaseapp.com
FIREBASE_PROJECT_ID=           # Your Firebase project ID
FIREBASE_STORAGE_BUCKET=       # Usually: project-id.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=  # From Firebase Console
FIREBASE_APP_ID=               # From Firebase Console
FIREBASE_MEASUREMENT_ID=       # From Firebase Console

# App Check (required for production)
RECAPTCHA_SITE_KEY=            # From reCAPTCHA v3 setup

# API Configuration (optional, has defaults)
API_BASE_URL=                  # Backend API URL
WS_BASE_URL=                   # WebSocket URL
```

## 📚 More Documentation

- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Main README**: [README.md](../README.md)
- **Local Setup Guide**: [SETUP_LOCAL_DEV.md](./SETUP_LOCAL_DEV.md)

## 🆘 Need Help?

1. Review [Common Issues](#common-issues) above
2. Check [SETUP_LOCAL_DEV.md](./SETUP_LOCAL_DEV.md) for detailed setup
3. Ask your team lead
4. Check Firebase documentation

## 📞 Emergency Contacts

If you suspect a security breach:
1. Immediately notify the team lead
2. Do NOT commit or push any changes
3. Rotate any exposed credentials immediately

