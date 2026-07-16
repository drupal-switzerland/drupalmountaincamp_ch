#!/bin/bash

# Prompt the user to confirm the action before proceeding. Answering anything but y will abort the script.
read -p "This will drop the current database and import the init.sql.gz dump. Are you sure you want to continue? (y/N) " -n 1 -r
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
  echo  # move to a new line
  echo "Skipping import... If the db is not already imported, you may need to run 'lando init-db' manually."
  exit 0
fi

# Remove the existing db.
/app/drupal/vendor/bin/drush sql:drop -y

# Extract and import the dump.
echo "Importing init.sql.gz..."
gunzip -c /app/drupal/dump/init.sql.gz | /app/drupal/vendor/bin/drush sqlc

# Deploying
echo "Running drush deploy"
/app/drupal/vendor/bin/drush deploy
