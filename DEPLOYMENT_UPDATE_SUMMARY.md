# Deployment Configuration Update Summary

## Changes Made

This update fixes the deployment issue where environment variables (API keys and Firebase configuration) were not being passed to the build process in GitHub Actions.

### Files Modified

#### 1. `.github/workflows/deploy.yml`
**Changes**: Added all required environment variables to the build step

- Added `FIREBASE_API_KEY` (required)
- Added `FIREBASE_AUTH_DOMAIN`
- Added `FIREBASE_PROJECT_ID`
- Added `FIREBASE_STORAGE_BUCKET`
- Added `FIREBASE_MESSAGING_SENDER_ID`
- Added `FIREBASE_APP_ID`
- Added `FIREBASE_MEASUREMENT_ID`
- Added `RECAPTCHA_SITE_KEY` (required for production)
- Added `API_BASE_URL` (from variables)
- Added `WS_BASE_URL` (from variables)

**Why**: The `set-env.js` script (which runs before build) requires these environment variables to generate the environment files. Without them, the build fails.

#### 2. `DEPLOYMENT.md`
**Changes**: Complete documentation update

- Added "Quick Start" section with `npm run show:secrets` command
- Added comprehensive list of all required GitHub Secrets (11 total)
- Added detailed descriptions for each Firebase configuration secret
- Added `API_BASE_URL` and `WS_BASE_URL` to Variables section
- Updated troubleshooting section with environment variable-specific issues
- Added helpful examples and error solutions

#### 3. `scripts/show-github-secrets.js` (NEW)
**Created**: Helper script to display GitHub configuration

This script:
- Reads your local `.env` file
- Shows all values that need to be added to GitHub
- Distinguishes between Secrets and Variables
- Masks sensitive values for security
- Warns about missing or placeholder values
- Provides clear instructions for each configuration item

Usage: `npm run show:secrets`

#### 4. `package.json`
**Changes**: Added new npm script

- Added `"show:secrets": "node scripts/show-github-secrets.js"`

#### 5. `README.md`
**Changes**: Updated Environment Configuration section

- Replaced manual configuration instructions with automated setup
- Added step-by-step guide using npm scripts
- Added reference to `npm run show:secrets` for deployment
- Emphasized that environment files should never be committed

#### 6. `.github/workflows/deploy.yml.example`
**Changes**: Updated to use variables instead of secrets for non-sensitive data

- Changed `API_BASE_URL` from `secrets` to `vars`
- Changed `WS_BASE_URL` from `secrets` to `vars`

## What You Need to Do

### 1. Configure GitHub Secrets

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → Secrets tab**

Add the following secrets (get values from your local `.env` file):

```bash
# Run this command to see your values:
npm run show:secrets
```

Required secrets:
- `FIREBASE_API_KEY` ⚠️ **Required**
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`
- `RECAPTCHA_SITE_KEY` ⚠️ **Required for production**
- `SSH_PRIVATE_KEY` (if not already configured)
- `SSH_USER` (if not already configured)
- `SSH_HOST` (if not already configured)

### 2. Configure GitHub Variables

Go to your GitHub repository:
**Settings → Secrets and variables → Actions → Variables tab**

Add the following variables:
- `DEPLOY_PATH` = `/var/www/html/app.wattbrews.me`
- `API_BASE_URL` = `https://wattbrews.me/api/v1`
- `WS_BASE_URL` = `wss://wattbrews.me/ws`

### 3. Test the Deployment

After configuring all secrets and variables:

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "fix: add environment variables to deployment workflow"
   git push origin main
   ```

2. Monitor the GitHub Actions workflow:
   - Go to your repository → Actions tab
   - Watch the deployment progress
   - Check for any errors in the build logs

3. If the build fails:
   - Check the error message in GitHub Actions logs
   - Verify all secrets and variables are set correctly
   - Ensure there are no typos or extra spaces in the values

## Quick Commands Reference

```bash
# Show what values need to be added to GitHub
npm run show:secrets

# Verify your local environment setup
npm run verify:env

# Generate environment files from .env
npm run config:dev

# Build for production (uses same env vars)
npm run build
```

## Common Issues and Solutions

### Issue: Build fails with "FIREBASE_API_KEY environment variable is required"
**Solution**: Add `FIREBASE_API_KEY` to GitHub Secrets

### Issue: App deploys but shows Firebase errors
**Solution**: 
1. Verify all Firebase secrets match your Firebase Console
2. Check for extra spaces or quotes in secret values
3. Re-run deployment after fixing

### Issue: Can't find where to add secrets
**Solution**: 
1. Go to your GitHub repository
2. Click "Settings" (top navigation)
3. In left sidebar: "Secrets and variables" → "Actions"
4. Use "Secrets" tab for sensitive data, "Variables" tab for non-sensitive data

## Why This Was Needed

Previously, the deployment workflow only set `NODE_ENV: production` for the build step. However, the `set-env.js` script (which runs as a prebuild step) requires all the Firebase and API configuration to generate the environment files that Angular uses during the build.

Without these variables:
- ✅ Local builds work (because you have a `.env` file)
- ❌ GitHub Actions builds fail (no `.env` file, no environment variables)

Now with this fix:
- ✅ Local builds work (using `.env` file)
- ✅ GitHub Actions builds work (using Secrets and Variables)

## Security Notes

- **Secrets** are encrypted and never exposed in logs
- **Variables** are visible in logs but should contain non-sensitive data (like URLs)
- Never commit your `.env` file to version control
- Never commit generated `environment.ts` files
- The `.gitignore` is already configured to protect these files

---

**Created**: October 16, 2025  
**Issue**: Deployment fails due to missing environment variables  
**Status**: ✅ Fixed

