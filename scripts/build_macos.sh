#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$project_root"

python3 -m PyInstaller --noconfirm --clean "src/Seedance Workflow V4.3.5.spec"

echo "Build created under dist/."
echo "This development build is not Developer ID signed or notarized."

