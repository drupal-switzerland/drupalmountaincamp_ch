#!/usr/bin/env bash
set -euo pipefail

root_dir=$(pwd)
echo "$root_dir";

### Initial setup and validations
cd drupal
echo "memory_limit = 1024M" >> $PHP_INI_DIR/php.ini
source ${HOME}/.bashrc
# Validate composer
composer validate --no-check-all --ansi
composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader

### Code validation
# PHP Code Sniffer.
vendor/bin/phpcs
# Checks for common issues, such as failure to use DI.
vendor/bin/phpstan

# Import database (not needed if you use the prebuild database)
# drush -y sql-drop
# gunzip -c dump/init.sql.gz | drush sqlc

# Install config and run phpunit tests.
mkdir -p docroot/sites/simpletest
drush status
drush deploy -y
# Start a server and run the unit tests.
drush rs 8888 & server_pid=$!
sleep 3
if ! ps -p $server_pid > /dev/null
then
  echo 'Error: Failed to start the drush server needed to run tests.'
  exit 1
fi

# We don't want the script to exit immediately as we would like to run drush ws
# before exiting to get an errors from the server side where requests are made
# in phpunit existing site tests.
set +e
vendor/bin/phpunit -v --testdox
status=$?
if [ $status -ne 0 ]
then
  echo "PHPUnit failed"
  drush ws --count=200 --severity-min=Fehler --extended
  exit $status
fi
