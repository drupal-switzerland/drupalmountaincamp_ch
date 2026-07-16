#!/usr/bin/env bash


echo "-----------------------------------------------------------"
echo "Update sql dump file with local database"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "-----------------------------------------------------------"
echo "Switch directory to drupal web folder"
cd $DIR/..
pwd

#upload a git delta of the file
echo "Export sql dump and gzip it"
echo "-----------------------------------------------------------"
rm -f dump/init.sql.gz
drush sql-dump > dump/init.sql
gzip dump/init.sql


echo "All done..."

