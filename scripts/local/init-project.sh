#!/usr/bin/env bash

set -e

display_usage() {
  echo "Usage: $0 <type>"
  echo "  <type> should be either 'lando' or 'ddev'"
  exit 1
}

#---------------------------------------------------------------
#                           Functions
#---------------------------------------------------------------

copy_env_files() {

  echo -e "Copying .env file in drupal folder"
  if ! file_exists "$DRUPAL_ENV_FILE_PATH"; then
    cp "$DRUPAL_ENV_EXAMPLE_FILE_PATH" "$DRUPAL_ENV_FILE_PATH"
    print_green 'done'
  else
    print_green "$DRUPAL_ENV_FILE_PATH already exists"
  fi

  echo -e "Copying .env file in frontend folder"
  if ! file_exists "$FRONTEND_ENV_FILE_PATH"; then
    cp "$FRONTEND_ENV_EXAMPLE_FILE_PATH" "$FRONTEND_ENV_FILE_PATH"
    print_green 'done'
  else
    print_green "$FRONTEND_ENV_FILE_PATH already exists"
  fi

  display_info_message "You can customize your .env files to fit your setup."
}

# Check rokka setup
check_rokka_setup() {
  if [ ! -f "$DRUPAL_ENV_FILE_PATH" ]; then
    echo "Error: $DRUPAL_ENV_FILE_PATH not found."
    exit 1
  fi

  local ROKKA_API_KEY=$(grep -E '^ROKKA_API_KEY=' "$DRUPAL_ENV_FILE_PATH" | cut -d '=' -f2)
  local ROKKA_ORGANIZATION_NAME=$(grep -E '^ROKKA_ORGANIZATION_NAME=' "$DRUPAL_ENV_FILE_PATH" | cut -d '=' -f2)

  local EXAMPLE_ROKKA_API_KEY=$(grep -E '^ROKKA_API_KEY=' "$DRUPAL_ENV_EXAMPLE_FILE_PATH" | cut -d '=' -f2)
  local EXAMPLE_ROKKA_ORGANIZATION_NAME=$(grep -E '^ROKKA_ORGANIZATION_NAME=' "$DRUPAL_ENV_EXAMPLE_FILE_PATH" | cut -d '=' -f2)

  if [ "$ROKKA_API_KEY" == "$EXAMPLE_ROKKA_API_KEY" ] && [ "$ROKKA_ORGANIZATION_NAME" == "$EXAMPLE_ROKKA_ORGANIZATION_NAME" ]; then
    read -p "Your Rokka API key: " NEW_ROKKA_API_KEY
    read -p "Your Rokka organization: " NEW_ROKKA_ORGANIZATION_NAME

    sed -i.bak "s/^ROKKA_API_KEY=.*/ROKKA_API_KEY=$NEW_ROKKA_API_KEY/" "$DRUPAL_ENV_FILE_PATH"
    sed -i.bak "s/^ROKKA_ORGANIZATION_NAME=.*/ROKKA_ORGANIZATION_NAME=$NEW_ROKKA_ORGANIZATION_NAME/" "$DRUPAL_ENV_FILE_PATH"

    sed -i.bak "s/^\(NUXT_PUBLIC_ROKKA_HOST=\).*/\1$NEW_ROKKA_ORGANIZATION_NAME.rokka.io/" "$FRONTEND_ENV_FILE_PATH"
    sed -i.bak "s/^ROKKA_KEY=.*/ROKKA_KEY=$NEW_ROKKA_API_KEY/" "$FRONTEND_ENV_FILE_PATH"

    # Remove backup files created by sed
    rm "$DRUPAL_ENV_FILE_PATH.bak" "$FRONTEND_ENV_FILE_PATH.bak"
  else
    echo "Rokka setup is already done."
  fi
  source scripts/rokka/rokka_setup.sh upload_images
}

#---------------------------------------------------------------
#                           Include Code
#---------------------------------------------------------------

INCLUDE_PATH="scripts/local/includes"

# Load all include code
if ! source "$INCLUDE_PATH/all.sh"; then
  echo "all.sh not found. Exiting..."
  exit 2
fi

#---------------------------------------------------------------
#                           Main code
#---------------------------------------------------------------

# Check if the type argument is provided and valid
if [ -z "$1" ] || { [ "$1" != "lando" ] && [ "$1" != "ddev" ]; }; then
  echo "Error: Missing argument setup type."
  display_usage
fi

TYPE=$1
DRUPAL_ENV_FILE_PATH='drupal/.env'
DRUPAL_ENV_EXAMPLE_FILE_PATH='drupal/.env.example'
FRONTEND_ENV_FILE_PATH='frontend/.env'
FRONTEND_ENV_EXAMPLE_FILE_PATH='frontend/.env.example'

# Check if the output of the command "lando list" is [] and warn the user.
if [ "$TYPE" == "ddev" ]; then
  if command -v lando &> /dev/null; then
    if [ "$(lando list)" != "[]" ]; then
      print_red "lando instances running. Please make sure you have run 'lando poweroff' before using ddev."
      exit 1
    fi
  fi
fi

print_script_header "Setup Project"

# Copy .env files
print_separator "Copy .env files"
copy_env_files

# Ask user about rokka.io setup
print_separator "rokka.io setup (Image transformations and CDN)"
echo "1. I have a rokka.io account and can provide an API key"
echo "2. I have no account and want to create one for free"
echo "3. I want to skip the rokka.io setup. Images display and image upload will not work"
read -p "Please select an option (1, 2, or 3): " rokka_option

case $rokka_option in
  1)
    check_rokka_setup
    ;;
  2)
    echo "Go to https://rokka.io/dashboard/#/signup and get a free API key. Then restart the installation."
    exit 0
    ;;
  3)
    echo "Skipping rokka.io setup. Images and image upload will not work."
    ;;
  *)
    echo "Invalid option. Exiting..."
    exit 1
    ;;
esac

# Clear the lando tasks cache.
if [ "$TYPE" == "lando" ]; then
  print_separator "Clear the lando tasks cache"
  display_command 'lando --clear'
  lando --clear
fi

if [ "$TYPE" == "ddev" ]; then
  print_separator "Setup DDEV config files"
  display_command 'ddev config --project-type=drupal'
  ddev config --update --project-type=drupal
fi

# Start Lando or DDEV.
print_separator "Starting $TYPE"
display_command "$TYPE start"
$TYPE start
# If DDEV, then also run 'ddev auth ssh'
if [ "$TYPE" == "ddev" ]; then
  display_command "$TYPE auth ssh"
  $TYPE auth ssh
fi

# Run composer install within the drupal folder.
print_separator "Running composer install"
display_command "$TYPE composer install"
if [ "$TYPE" == "lando" ]; then
  cd drupal
  $TYPE composer install
  cd ..
else
  $TYPE composer install
fi

# Database Sync.
print_separator "Database Sync / Import"
display_command "$TYPE init-db"
$TYPE init-db

# Set up admin account.
print_separator "Set up admin accounts"
display_command "$TYPE drush upwd admin \"password\""
$TYPE drush upwd admin "password"
display_command "$TYPE drush user:role:add administrator admin"
$TYPE drush user:role:add 'administrator' admin

# Set upload image style to rokka.
if [ "$rokka_option" != "3" ]; then
  print_separator "Upload image styles to rokka"
  display_command "$TYPE drush rim --force"
  $TYPE drush rim --force
fi

# Convert the database language to english.
if prompt_yes_no "The default demo database is in german. Do you prefer to convert it to english"; then
  display_command "$TYPE drush blokkli_starterkit:convert-db-language de en"
  $TYPE drush blokkli_starterkit:convert-db-language de en
fi

# Install the frontend.
print_separator "Running bun install within the frontend container."
display_command "$TYPE bun install"
print_yellow 'Please have some patience. This will take a few minutes.'
$TYPE bun install

# Build styles.
print_separator "Rebuild styles such as styles for backend and ckeditor"
display_command "$TYPE bun run styles"
$TYPE bun run styles

# Prompt to start frontend.
print_separator "Running frontend in development mode"
display_info_message "Frontend needs be started separately and is not needed if you want to develop for the backend only."
if prompt_yes_no "Do you want to start the development mode of the frontend with$COLOR_YELLOW $TYPE bun run dev$COLOR_BLACK?"; then
  $TYPE bun run dev
else
  display_info_message "You can always run$COLOR_YELLOW lando bun run dev$COLOR_BLACK by yourself."
  display_info_message "If you access the frontpage without starting the frontend, it will fallback to drupal."
fi

