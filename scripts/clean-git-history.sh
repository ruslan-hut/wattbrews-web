#!/bin/bash

# Script to remove sensitive data from git history
# This removes the compromised API key from all commits

set -e

echo "🔒 Git History Cleanup Script"
echo "================================"
echo ""
echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  This will require a force push to your repository."
echo "⚠️  Make sure all team members are aware before proceeding."
echo ""
echo "This script will:"
echo "  1. Remove the compromised API key from all commits"
echo "  2. Rewrite the git history"
echo "  3. Clean up and garbage collect"
echo ""

read -p "Do you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    echo "Aborted."
    exit 1
fi

# The old compromised API key to remove
# NOTE: Replace with actual key if you need to run this script
OLD_API_KEY="AIzaSyB0...xSEkw"
PLACEHOLDER="PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT"

echo "📝 Creating backup branch..."
git branch backup-before-history-cleanup || echo "Backup branch already exists"

echo "🔍 Searching for commits with the exposed key..."
git log --all --source --full-history -S"$OLD_API_KEY" --pretty=format:"%H %s" || echo "No commits found (already cleaned?)"

echo ""
echo "🧹 Replacing the exposed API key in history..."

# Use filter-branch to replace the key in history
git filter-branch --force --tree-filter '
  for file in src/environments/environment.ts src/environments/environment.development.ts; do
    if [ -f "$file" ]; then
      sed -i.bak "s/$OLD_API_KEY/PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT/g" "$file"
      rm -f "$file.bak"
    fi
  done
' --tag-name-filter cat -- --all

echo "🗑️  Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify the changes: git log --all -S'<YOUR_OLD_KEY>'"
echo "     (This should return no results)"
echo "  2. Force push to remote: git push origin --force --all"
echo "  3. Force push tags: git push origin --force --tags"
echo "  4. Notify your team to re-clone the repository"
echo ""
echo "⚠️  Remember: The old API key is still compromised. Make sure you've:"
echo "     - Regenerated the API key in Firebase Console"
echo "     - Added API key restrictions in Google Cloud Console"
echo "     - Updated your .env file with the new key"

