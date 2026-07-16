#!/usr/bin/env bash
set -euo pipefail
pwd

# Go to frontend folder and build frontend.
cd frontend
bun --version
node --version

ls -la

# Installs dependencies from cache and ignores scripts including postinstall.
#npm ci --cache ${CI_PROJECT_DIR}/.npm_global_cache --prefer-offline --ignore-scripts
bun install

# Run prettier
bun run prettier

# Run TS check
bun run typecheck

# Run lint
bun run lint
