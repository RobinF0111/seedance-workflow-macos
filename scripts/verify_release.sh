#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
static_dir="$root_dir/Seedance Workflow V4.3.5.app/Contents/Resources/static"

node --check "$static_dir/app.js"
test -s "$static_dir/index.html"
test -s "$static_dir/styles.css"

if grep -REn --exclude-dir=.git --exclude='*.md' --exclude='verify_release.sh' \
  'sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|OPENAI_API_KEY[[:space:]]*=' "$root_dir"; then
  echo "Potential credential detected." >&2
  exit 1
fi

if git -C "$root_dir" ls-files | grep -E '(\.DS_Store$|\.log$|\.env($|\.))'; then
  echo "Local-only file is tracked." >&2
  exit 1
fi

echo "Repository verification passed."
