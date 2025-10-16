# Environment Configuration

## 🔒 Security Notice

**IMPORTANT**: The actual `environment.ts` and `environment.development.ts` files are **NOT committed to git** because they contain sensitive API keys.

## How It Works

### Files in Git (Committed)
- ✅ `environment.ts.template` - Template with placeholders
- ✅ `environment.development.ts.template` - Template with placeholders
- ✅ `README.md` - This file

### Files NOT in Git (Gitignored - Generated Locally)
- ❌ `environment.ts` - Auto-generated with real API keys
- ❌ `environment.development.ts` - Auto-generated with real API keys

## Setup Instructions

### For New Team Members

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` and add your credentials**:
   ```bash
   FIREBASE_API_KEY=your-real-api-key-here
   RECAPTCHA_SITE_KEY=your-recaptcha-key-here
   # ... other variables
   ```

3. **Generate environment files**:
   ```bash
   npm run config:dev
   ```
   
   Or just run:
   ```bash
   npm start
   ```
   (This automatically runs the config script)

4. **The generated files are created automatically**:
   - `environment.ts` ← Generated from your `.env`
   - `environment.development.ts` ← Generated from your `.env`

### Build Process

```
┌─────────────────────────────────────────────────┐
│  .env (your credentials, gitignored)            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  scripts/set-env.js                             │
│  Reads .env and generates:                      │
│  • environment.ts (with real keys)              │
│  • environment.development.ts (with real keys)   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Angular Build                                   │
│  Uses environment.ts for production             │
│  Uses environment.development.ts for development │
└─────────────────────────────────────────────────┘
```

## What Gets Committed

```
✅ COMMIT to git:
   - .env.example (template)
   - environment.ts.template (placeholder)
   - environment.development.ts.template (placeholder)
   - scripts/set-env.js (generator)

❌ NEVER commit:
   - .env (your real credentials)
   - environment.ts (generated with real keys)
   - environment.development.ts (generated with real keys)
```

## Troubleshooting

### "PLACEHOLDER" error in browser
**Problem**: Environment files not generated

**Solution**:
```bash
npm run config:dev
```

### Files missing after clone
**Problem**: This is normal! The actual environment files are generated, not committed.

**Solution**:
1. Create `.env` file (see Setup Instructions above)
2. Run `npm start`

### Changes to environment not reflected
**Problem**: Need to regenerate files

**Solution**:
```bash
npm run config:dev  # Regenerate from .env
npm start           # Restart dev server
```

## For CI/CD

In your CI/CD platform (GitHub Actions, GitLab CI, etc.):

1. Set environment variables as **secrets**:
   - `FIREBASE_API_KEY`
   - `RECAPTCHA_SITE_KEY`
   - etc.

2. The build script will automatically generate environment files from these secrets

3. Example GitHub Actions:
   ```yaml
   env:
     FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
     RECAPTCHA_SITE_KEY: ${{ secrets.RECAPTCHA_SITE_KEY }}
   
   steps:
     - run: npm run build
       # This automatically runs scripts/set-env.js
   ```

## Security

✅ **What's secure**:
- API keys stored in `.env` (gitignored)
- Actual environment files gitignored
- Only placeholders in git history
- Real keys injected at build time

❌ **Never do this**:
- Commit `.env` file
- Commit environment files with real keys
- Hardcode API keys in templates
- Share credentials via email/chat
- Disable the pre-commit hook

## More Information

- Full security guide: `/SECURITY_SETUP.md`
- Quick reference: `/QUICK_REFERENCE.md`
- Implementation details: `/IMPLEMENTATION_SUMMARY.md`

