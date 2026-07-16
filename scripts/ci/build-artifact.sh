#!/usr/bin/env bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

root_dir=$(pwd)

set -e

# Go to frontend folder and build frontend.
cd frontend

bun --version
node --version

# Preparation
# Use the cache instead of delete everything with npm run ci
#npm ci --cache ${CI_PROJECT_DIR}/.npm_global_cache --prefer-offline
bun install

# Build frontend
bun run styles
bun run build

cd "$root_dir"
cd drupal

echo "memory_limit = 1024M" >> $PHP_INI_DIR/php.ini
source ${HOME}/.bashrc

### Initial setup and validations
composer --version
composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader

## BLT: Build artifact
git config --global user.email "doombot@liip.ch"
git config --global user.name "Gitlab Doom Bot"

git status

drush artifact_deployment:build --destination-git-branch="${TARGET_BRANCH}" --destination-git-url="git@gitlab.liip.ch:liip/nuxt-graphql-starterkit-build.git" --post-build-script="$DIR/finish-artifact.sh"
