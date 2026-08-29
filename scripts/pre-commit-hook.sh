#!/bin/bash

# Pre-commit hook to prevent committing sensitive data
# To install: cp scripts/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# The rule this hook is built on: it may only print its success line when every
# check actually ran. A scanner that cannot run and says nothing is worse than
# no scanner, because the green tick is taken as evidence.

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

# Files to check, read NUL-separated: a path containing a space would otherwise
# split into two paths that match no file and be skipped silently.
FILES=()
while IFS= read -r -d '' FILE; do
  FILES+=("$FILE")
done < <(git diff --cached --name-only --diff-filter=ACM -z)

echo "🔍 Checking for sensitive data in staged files..."

# Check each file
for FILE in "${FILES[@]}"; do
  for PATTERN in "${PATTERNS[@]}"; do
    # Scan the staged blob rather than the file on disk. The index is what is
    # being committed, so a secret staged and then edited out of the working
    # copy passes a working-tree scan while still going into the commit.
    #
    # `--` ends option parsing. The private key pattern begins with ----- and
    # grep read it as flags, so that check errored out on every file while the
    # hook went on to report no sensitive data found.
    git show ":$FILE" 2>/dev/null | grep -qE -- "$PATTERN"
    # PIPESTATUS is rebuilt by the next command, and an assignment is a command:
    # reading it twice leaves the second read empty, and `[ "" -eq 0 ]` then
    # errors quietly and the hook walks on to its success line. Copy the whole
    # array in one go.
    STATUSES=("${PIPESTATUS[@]}")
    SHOW_STATUS=${STATUSES[0]}
    GREP_STATUS=${STATUSES[1]}

    if [ "$SHOW_STATUS" -ne 0 ]; then
      echo -e "${RED}❌ ERROR: Could not read staged content of $FILE${NC}"
      echo ""
      echo "A file that cannot be scanned is not a file that is known to be clean."
      exit 1
    fi

    if [ "$GREP_STATUS" -eq 0 ]; then
      echo -e "${RED}❌ ERROR: Potential sensitive data found in $FILE${NC}"
      echo -e "${YELLOW}   Pattern matched: $PATTERN${NC}"
      echo ""
      echo "Please remove sensitive data before committing."
      echo "If this is a false positive, you can bypass this hook with: git commit --no-verify"
      exit 1
    fi

    # grep exits 1 for "no match" and 2 or more for "could not run". Treating
    # the second as the first is exactly how a scanner fails open.
    if [ "$GREP_STATUS" -gt 1 ]; then
      echo -e "${RED}❌ ERROR: Scan of $FILE failed (grep exit $GREP_STATUS)${NC}"
      echo -e "${YELLOW}   Pattern: $PATTERN${NC}"
      echo ""
      echo "The check could not run, so this commit is not known to be clean."
      exit 1
    fi
  done
done

# Check for .env file. -x -F matches the whole line literally; the old '^.env$'
# was a regex whose dot matched any character, so it also flagged paths like
# 'aenv' and would have missed nothing only by luck.
if [ ${#FILES[@]} -gt 0 ] && printf '%s\n' "${FILES[@]}" | grep -qxF '.env'; then
  echo -e "${RED}❌ ERROR: Attempting to commit .env file!${NC}"
  echo ""
  echo "The .env file should never be committed."
  echo "Make sure it's in .gitignore"
  exit 1
fi

# Check for actual API keys in environment files (not placeholders)
for FILE in "${FILES[@]}"; do
  if [[ "$FILE" == *"environment"*".ts" ]]; then
    STAGED=$(git show ":$FILE" 2>/dev/null)
    if [ $? -ne 0 ]; then
      echo -e "${RED}❌ ERROR: Could not read staged content of $FILE${NC}"
      exit 1
    fi
    if printf '%s' "$STAGED" | grep -qE -- 'apiKey: ?"[^P][^L]'; then
      # Check if it contains a real key (not PLACEHOLDER)
      if ! printf '%s' "$STAGED" | grep -qF -- "PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT"; then
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
