#!/usr/bin/env bash
set -euo pipefail

# Check if alias argument is provided
if [ $# -eq 0 ]; then
  echo "Please provide the Drush Alias. (@$alias or @live)"
  exit 1
fi

alias=$1
branch=${2:-1.0.x}

root_dir=$(pwd)
echo "$root_dir";

### Initial setup and validations
source ${HOME}/.bashrc

drush @$alias ssh "ddev drush status"
drush @$alias ssh "chmod +w sites/default"
drush @$alias ssh "git fetch && git checkout $branch && git pull"
drush @$alias ssh "chmod -w sites/default"
drush @$alias ssh "ddev restart"
drush @$alias ssh "ddev composer install"
drush @$alias ssh "ddev drush updb -y"
drush @$alias ssh "ddev drush cr"
drush @$alias ssh "ddev drush deploy"
# You need 4GB if you build on the server
drush @$alias ssh "ddev exec 'cd /var/www/html/frontend && bun install'"
drush @$alias ssh "ddev exec 'cd /var/www/html/frontend && bun run build'"

# Restart the bun supervisord daemon
drush @$alias ssh "ddev exec 'supervisorctl stop webextradaemons:frontend'"
drush @$alias ssh "ddev exec 'pkill -9 bun'"
drush @$alias ssh "ddev exec 'supervisorctl start webextradaemons:frontend'"
