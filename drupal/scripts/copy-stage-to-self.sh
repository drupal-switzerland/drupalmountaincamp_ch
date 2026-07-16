#!/usr/bin/env bash

#execute on the dev system
echo "This script has to be executed on the target system"
echo "Drush defines the alias @self to refer to the currently bootstrapped site."

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "-----------------------------------------------------------"
echo "Switch directory to drupal web folder"
cd $DIR/../docroot
pwd

# Deleting all tables in database.
echo 'Deleting all tables in database'
drush sql:drop -y

#copy over db
echo "copy over database"
drush sql-sync @stage.stage @self -y

echo "import local config"
drush updb -y
drush config-import -y

#rsync files folder
echo "Rsyncing files from live system"
drush rsync @stage.stage:%files/ @self:%files --exclude-paths=download:styles -y

echo "Cache rebuild"
drush cr

echo "All done..."
