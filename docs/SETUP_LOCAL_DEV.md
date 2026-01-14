# Local Development Setup Guide

## 🔧 Quick Fix for "API key not valid" Error

If you're seeing errors like `PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT` or "API key not valid", follow these steps:

### Step 1: Create Your `.env` File

```bash
cp env.example .env
```

### Step 2: Get Your Firebase API Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **evcharge-68bc8**
3. Go to **Project Settings** (gear icon)
4. Scroll to "Your apps" section
5. Copy the **Web API Key**

### Step 3: Add Your API Key to `.env`

Edit the `.env` file and replace `your-firebase-api-key-here` with your actual key:

```env
# Firebase Configuration (REQUIRED)
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # ← Paste your real key here
FIREBASE_AUTH_DOMAIN=evcharge-68bc8.firebaseapp.com
FIREBASE_PROJECT_ID=evcharge-68bc8
FIREBASE_STORAGE_BUCKET=evcharge-68bc8.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=547191660448
FIREBASE_APP_ID=1:547191660448:web:fb16383e8249ddfc360ec5
FIREBASE_MEASUREMENT_ID=G-Z2M3DF6LCY

# reCAPTCHA Configuration (Optional for development)
RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here

# API Configuration (defaults work fine)
API_BASE_URL=https://wattbrews.me/api/v1
WS_BASE_URL=wss://wattbrews.me/ws

# Environment
NODE_ENV=development
```

### Step 4: Generate Environment Files

```bash
npm run config:dev
```

You should see:
```
✓ Loaded environment variables from .env file
✓ Environment files generated successfully
  - environment.ts (production)
  - environment.development.ts (development)
  - Production mode: false
  - Firebase Project: evcharge-68bc8
  - API URL: https://wattbrews.me/api/v1
```

### Step 5: Start Development Server

```bash
npm start
```

The `npm start` command now automatically runs `npm run config:dev` first, so your environment files are always up to date!

---

## 🔒 Security Checklist

✅ **DO:**
- Keep your `.env` file LOCAL ONLY (it's gitignored)
- Store API keys in `.env` file
- Use the `npm run config:dev` script to generate environment files
- Verify `.env` is in `.gitignore` before committing

❌ **DON'T:**
- Commit `.env` file to git
- Hardcode API keys in source files
- Share API keys via email/Slack
- Commit `environment.ts` or `environment.development.ts` files
- Edit the generated environment files directly (they'll be overwritten)

---

## 📋 How It Works

```
┌─────────────────────────────────────┐
│  .env (your real credentials)       │  ← Created by you, NEVER committed
│  ✓ FIREBASE_API_KEY=AIza...         │
│  ✓ RECAPTCHA_SITE_KEY=6Le...        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  scripts/set-env.js                 │  ← Runs automatically
│  Reads .env and generates:          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  environment.development.ts         │  ← Generated, NEVER committed
│  export const environment = {       │
│    firebase: {                      │
│      apiKey: "AIza..."  ← Real key  │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Error: "FIREBASE_API_KEY environment variable is required"

**Solution**: You haven't created the `.env` file or the `FIREBASE_API_KEY` is empty.

```bash
# Check if .env exists
ls -la .env

# If missing, create it
cp env.example .env

# Edit and add your API key
nano .env  # or use your favorite editor
```

### Error: "API key not valid. Please pass a valid API key"

**Solution**: The API key in your `.env` is incorrect or you haven't run the config script.

```bash
# Regenerate environment files
npm run config:dev

# Verify the generated file
cat src/environments/environment.development.ts | grep apiKey
# Should show your real key, not "PLACEHOLDER..."
```

### Environment files still have PLACEHOLDER

**Solution**: The `set-env.js` script didn't run or failed.

```bash
# Manually run the script
node scripts/set-env.js

# Check for errors
# If successful, restart your dev server
npm start
```

### Changes to `.env` not reflected in app

**Solution**: Need to regenerate and restart.

```bash
# Regenerate environment files
npm run config:dev

# Restart dev server
# Press Ctrl+C to stop, then:
npm start
```

---

## 🚀 Production Deployment

For production builds (CI/CD), set environment variables as **secrets** in your deployment platform:

### GitHub Actions Example:

```yaml
# .github/workflows/deploy.yml
env:
  FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
  RECAPTCHA_SITE_KEY: ${{ secrets.RECAPTCHA_SITE_KEY }}

steps:
  - name: Build
    run: npm run build
    # This automatically runs scripts/set-env.js with production flag
```

### Required Secrets:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `RECAPTCHA_SITE_KEY`

---

## 📚 Additional Resources

- [Firebase Setup Guide](../src/environments/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Quick Reference](./QUICK_REFERENCE.md)

---

## 🔑 Getting Firebase Credentials

### For Team Members:

1. Ask your project admin for access to the Firebase project
2. Once added, go to [Firebase Console](https://console.firebase.google.com/)
3. Select project: `evcharge-68bc8`
4. Navigate to: **Project Settings** → **General** → **Your apps**
5. Find the **Web App** configuration
6. Copy all the values to your `.env` file

### For Project Admins:

The Firebase configuration is publicly visible in your Firebase console (these are not secret, but the API key should still be protected through Firebase Security Rules).

---

## ✅ Verification

After setup, verify everything works:

```bash
# 1. Check .env exists and has your key
cat .env | grep FIREBASE_API_KEY
# Should show: FIREBASE_API_KEY=AIza...

# 2. Generate environment files
npm run config:dev
# Should show success message

# 3. Verify generated file
cat src/environments/environment.development.ts | grep apiKey
# Should show: apiKey: "AIza..." (not PLACEHOLDER)

# 4. Start dev server
npm start
# Should run without "API key not valid" errors

# 5. Test authentication
# Open http://localhost:4200
# Try to sign in with Google
# Should open authentication popup (not error)
```

---

**Last Updated**: October 2025  
**Maintained By**: Development Team

