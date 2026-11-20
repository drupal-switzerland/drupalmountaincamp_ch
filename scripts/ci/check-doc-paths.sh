#!/usr/bin/env bash
# Checks that repository paths named in ARCHITECTURE.md and AGENTS.md are
# tracked by git.
#
# Covered:
#   - inline code whose first path segment is a file or directory at the top
#     of the repository (from `git ls-tree`), with trailing punctuation removed;
#   - targets of relative Markdown links, without their #anchor.
# A path with a placeholder such as <Name> is checked up to the directory
# before the placeholder. A path with * is checked as a glob.
#
# Not covered: paths written relative to another directory, paths outside
# inline code and links, anchors, and anything else the text says. A path
# that only exists after an install or a build is reported as missing.
#
# Usage: scripts/ci/check-doc-paths.sh [file.md ...]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

DOCS=("$@")
if [[ ${#DOCS[@]} -eq 0 ]]; then
  DOCS=(ARCHITECTURE.md AGENTS.md)
fi

ROOTS=()
while IFS= read -r root; do
  ROOTS+=("$root")
done < <(git ls-tree --name-only HEAD)

checked=0
missing=0

is_root() {
  local first="${1%%/*}" root
  for root in "${ROOTS[@]}"; do
    if [[ "$first" == "$root" ]]; then
      return 0
    fi
  done
  return 1
}

# Whether git tracks the path: a file, a directory with tracked files, or a
# glob that matches tracked files.
is_tracked() {
  local path="${1%/}" magic="literal"
  if [[ "$path" == *"*"* ]]; then
    magic="glob"
  fi
  [[ -n "$(git ls-files -- ":($magic)$path" | head -n 1)" ]]
}

check() {
  local doc="$1" path="$2"
  if [[ "$path" == *"<"* ]]; then
    # Keep what comes before the placeholder, up to its last directory.
    path="${path%%<*}"
    path="${path%/*}"
    if [[ -z "$path" ]]; then
      return
    fi
  fi
  checked=$((checked + 1))
  if ! is_tracked "$path"; then
    echo "$doc: not tracked: $path"
    missing=$((missing + 1))
  fi
}

for doc in "${DOCS[@]}"; do
  if [[ ! -f "$doc" ]]; then
    echo "No such file: $doc" >&2
    exit 1
  fi

  while IFS= read -r path; do
    path="$(sed -E 's/[.,;:]+$//' <<<"$path")"
    if is_root "$path"; then
      check "$doc" "$path"
    fi
  done < <(grep -oE '`[^`]+`' "$doc" | tr -d '`' | grep -vE '[[:space:]]' | sort -u || true)

  while IFS= read -r path; do
    check "$doc" "$path"
  done < <(grep -oE '\]\([^)]+\)' "$doc" | sed -E 's/^\]\(//; s/\)$//; s/#.*$//' | grep -vE '^([a-z]+://|$)' | sort -u || true)
done

echo "$checked paths checked, $missing missing."
[[ "$missing" -eq 0 ]]
