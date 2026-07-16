#!/usr/bin/env bash

echo "Fetching update info. Please wait..."
rm -f /tmp/composer_update_dry_run_output.txt && composer update --dry-run -W >> /tmp/composer_update_dry_run_output.txt 2>&1

php scripts/composer-update-info/display-info.php app:display-update-info
