#!/usr/bin/env bash

set -e

#---------------------------------------------------------------
#                           Init vars
#---------------------------------------------------------------

# You can run "drush sa" to display all the Druash aliases.
DRUSH_ALIASES=()
DRUSH_ALIASES+=('live.live')
DRUSH_ALIASES+=('stage.stage')
DRUSH_ALIASES+=('self')

#---------------------------------------------------------------
#                           Functions
#---------------------------------------------------------------

function show_menu() {

  echo ""

  PS3='Please choose the desired environment by typing its number: '

  OPTIONS=()
  OPTIONS+=('Quit')
  OPTIONS+=('All')

  # Add predefined aliases as options
  for DRUSH_ALIAS in ${DRUSH_ALIASES[*]}; do
    OPTIONS+=($DRUSH_ALIAS)
  done

  select SELECTED_OPTION in "${OPTIONS[@]}"
  do

    case $SELECTED_OPTION in
      "Quit")
        exit
        break
      ;;
      "All")
        for DRUSH_ALIAS in ${DRUSH_ALIASES[*]}; do
          check_and_update_locale "$DRUSH_ALIAS"
        done
        break
      ;;
      *)
        check_and_update_locale "$SELECTED_OPTION"
        break;
      ;;
    esac
  done

  show_menu

}

function check_and_update_locale() {

  local ALIAS="$1"

  echo -e "\nCheck and update locale for $ALIAS"
  echo -e "-------------------------------------------"

  if [ "$ALIAS" == 'self' ]; then
    vendor/bin/drush cr && vendor/bin/drush locale:check && vendor/bin/drush locale:update
  else
    vendor/bin/drush @$ALIAS ssh "cd .. && vendor/bin/drush cr && vendor/bin/drush locale:check && vendor/bin/drush locale:update"
  fi
}

#---------------------------------------------------------------
#                           Main code
#---------------------------------------------------------------

echo -e "**********************************"
echo "Check and update locale"
echo -e "**********************************"

show_menu
