#!/usr/bin/env bash
# One-time setup: symlinks scripts/git-hooks/* into .git/hooks/.
# Run once after cloning the repo.

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_SRC="$REPO_ROOT/scripts/git-hooks"
HOOK_DST="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOK_DST" ]; then
  echo "setup-hooks: .git/hooks not found — are you in a git repo?" >&2
  exit 1
fi

for hook in "$HOOK_SRC"/*; do
  name="$(basename "$hook")"
  chmod +x "$hook"
  ln -sf "../../scripts/git-hooks/$name" "$HOOK_DST/$name"
  echo "installed: .git/hooks/$name -> scripts/git-hooks/$name"
done
