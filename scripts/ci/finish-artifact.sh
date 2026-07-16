#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "-----------------------------------------------------------"
echo "Switch directory to app folder"
cd $DIR/../../
pwd


# Create a temporary directory.
if [ -d "/tmp/build" ]; then rm -Rf /tmp/build; fi
mkdir /tmp/build

# Move the BLT artifact to a subfolder in the temp directory.
mv /tmp/drupal-artifact-build /tmp/build/drupal

# Move frontend build to temp directory.
mkdir -p /tmp/build/frontend
rsync -a frontend/.output /tmp/build/frontend
cp frontend/.nvmrc /tmp/build/frontend/.nvmrc

# Move the deploy and other folders to the temp directory.
rsync -a deploy /tmp/build
rsync -a lando /tmp/build
cp .gitignore /tmp/build

cp drupal/docroot/modules/custom/blokkli_starterkit/css/backend.css /tmp/build/drupal/docroot/modules/custom/blokkli_starterkit/css/backend.css
cp drupal/docroot/themes/custom/blokkli_starterkit/css/ckeditor.css /tmp/build/drupal/docroot/themes/custom/blokkli_starterkit/css/ckeditor.css

# Rename temporary directory to blt deploy directory.
mv /tmp/build /tmp/drupal-artifact-build

# This restores the API documentation
sed -i '/.vitepress\/dist/d' /tmp/drupal-artifact-build/.gitignore
# This hinders BLT from deleting all gz files (Cloudflare compatibility)
sed -i '/\*.gz/d' /tmp/drupal-artifact-build/.gitignore

if [ -d "/tmp/drupal-artifact-build/drupal/.git" ]; then
  mv /tmp/drupal-artifact-build/drupal/.git /tmp/drupal-artifact-build/.git
fi
