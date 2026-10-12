#!/usr/bin/env bash
# Checks that repository paths named in ARCHITECTURE.md and AGENTS.md exist.
#
# Covered:
#   - inline code that starts with a top-level directory or file of this
#     repository (the ROOTS list below), with trailing punctuation removed;
#   - targets of relative Markdown links, without their #anchor.
# A path with a placeholder such as <Name> is checked up to the directory
# before the placeholder. A path with * is checked as a glob.
#
# Not covered: paths written relative to another directory, paths outside
# inline code and links, anchors, and anything else the text says.
#
# Usage: scripts/ci/check-doc-paths.sh [file.md ...]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

DOCS=("$@")
if [[ ${#DOCS[@]} -eq 0 ]]; then
  DOCS=(ARCHITECTURE.md AGENTS.md)
fi

ROOTS='\.ddev|\.github|\.lagoon|\.lagoon\.yml|\.lando\.yml|deploy|docker-compose\.yml|drupal|frontend|lando|scripts|README\.md|ARCHITECTURE\.md|AGENTS\.md'

checked=0
missing=0

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
  if [[ "$path" == *"*"* ]]; then
    if ! compgen -G "$path" >/dev/null; then
      echo "$doc: nothing matches $path"
      missing=$((missing + 1))
    fi
  elif [[ ! -e "$path" ]]; then
    echo "$doc: missing $path"
    missing=$((missing + 1))
  fi
}

for doc in "${DOCS[@]}"; do
  if [[ ! -f "$doc" ]]; then
    echo "No such file: $doc" >&2
    exit 1
  fi

  while IFS= read -r path; do
    check "$doc" "$path"
  done < <(grep -oE '`[^`]+`' "$doc" | tr -d '`' | grep -E "^($ROOTS)(/|\$)" | sed -E 's/[.,;:]+$//' | sort -u || true)

  while IFS= read -r path; do
    check "$doc" "$path"
  done < <(grep -oE '\]\([^)]+\)' "$doc" | sed -E 's/^\]\(//; s/\)$//; s/#.*$//' | grep -vE '^([a-z]+://|$)' | sort -u || true)
done

echo "$checked paths checked, $missing missing."
[[ "$missing" -eq 0 ]]
