#!/usr/bin/env bash
# Push backend/ + the Dockerfile to a Hugging Face Space, which then rebuilds.
#
#   HF_SPACE=<username>/<space-name> ./deploy/hf-space/deploy.sh
#
# Auth: git asks for your HF username and, as the password, a *write* access token
# (https://huggingface.co/settings/tokens). Create the Space first (SDK: Docker).
set -euo pipefail

: "${HF_SPACE:?Set HF_SPACE=<username>/<space-name>}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$here/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git clone "https://huggingface.co/spaces/${HF_SPACE}" "$work/space"

rsync -a --delete --exclude '.git' "$here/Dockerfile" "$here/README.md" "$here/.dockerignore" "$work/space/"
rsync -a --delete \
  --exclude '__pycache__' --exclude '*.pyc' \
  --exclude 'cache' --exclude 'logs' --exclude 'tests' \
  "$repo_root/backend/" "$work/space/backend/"

cd "$work/space"
git add -A
if git diff --cached --quiet; then
  echo "Nothing changed; Space is already up to date."
  exit 0
fi
git commit -q -m "Deploy backend from $(git -C "$repo_root" rev-parse --short HEAD)"
git push
echo "Pushed. Watch the build at https://huggingface.co/spaces/${HF_SPACE}"
