#!/bin/bash

# Install git hooks for security

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GIT_HOOKS_DIR="$SCRIPT_DIR/../.git/hooks"

echo "🔧 Installing git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Install pre-commit hook
if [ -f "$GIT_HOOKS_DIR/pre-commit" ]; then
  echo "⚠️  Pre-commit hook already exists. Creating backup..."
  cp "$GIT_HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit.backup"
fi

cp "$SCRIPT_DIR/pre-commit-hook.sh" "$GIT_HOOKS_DIR/pre-commit"
chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-commit hook will now:"
echo "  - Prevent committing .env files"
echo "  - Scan for API keys and secrets"
echo "  - Check environment files for real credentials"
echo ""
echo "To bypass the hook (not recommended): git commit --no-verify"

