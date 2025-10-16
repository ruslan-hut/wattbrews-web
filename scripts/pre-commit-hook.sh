#!/bin/bash

# Pre-commit hook to prevent committing sensitive data
# To install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Patterns to search for
PATTERNS=(
  'AIzaSy[A-Za-z0-9_-]{33}'  # Google API Keys
  'AKIA[0-9A-Z]{16}'  # AWS Access Key
  'sk_live_[0-9a-zA-Z]{24}'  # Stripe Live Key
  'sk_test_[0-9a-zA-Z]{24}'  # Stripe Test Key
  '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY'  # Private keys
)

# Files to check
FILES=$(git diff --cached --name-only --diff-filter=ACM)

echo "🔍 Checking for sensitive data in staged files..."

# Check each file
for FILE in $FILES; do
  # Skip binary files and large files
  if [ -f "$FILE" ]; then
    # Check for each pattern
    for PATTERN in "${PATTERNS[@]}"; do
      if grep -qE "$PATTERN" "$FILE"; then
        echo -e "${RED}❌ ERROR: Potential sensitive data found in $FILE${NC}"
        echo -e "${YELLOW}   Pattern matched: $PATTERN${NC}"
        echo ""
        echo "Please remove sensitive data before committing."
        echo "If this is a false positive, you can bypass this hook with: git commit --no-verify"
        exit 1
      fi
    done
  fi
done

# Check for .env file
if echo "$FILES" | grep -q "^.env$"; then
  echo -e "${RED}❌ ERROR: Attempting to commit .env file!${NC}"
  echo ""
  echo "The .env file should never be committed."
  echo "Make sure it's in .gitignore"
  exit 1
fi

# Check for actual API keys in environment files (not placeholders)
for FILE in $FILES; do
  if [[ "$FILE" == *"environment"*".ts" ]]; then
    if grep -qE 'apiKey: ?"[^P][^L]' "$FILE"; then
      # Check if it contains a real key (not PLACEHOLDER)
      if ! grep -q "PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT" "$FILE"; then
        echo -e "${RED}❌ ERROR: Real API key found in $FILE${NC}"
        echo ""
        echo "Environment files should only contain placeholders."
        echo "Run 'npm run config:dev' to regenerate with placeholders."
        exit 1
      fi
    fi
  fi
done

echo "✅ No sensitive data detected"
exit 0

