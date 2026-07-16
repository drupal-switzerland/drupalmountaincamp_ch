#!/usr/bin/env bash

#---------------------------------------------------------------
#                           Init vars
#---------------------------------------------------------------

function select_menu () {

  echo ''

  vendor/bin/drush search-api:status

  echo -e "\nWhat would you like to reindex?"
  echo -e "------------------------------------\n"

  COLUMNS=0
  PS3='Please what to re-index: '

  select SELECTED_OPTION in "${OPTIONS[@]}"
  do

    case $SELECTED_OPTION in
      "Quit")
        exit
        break
      ;;
      "All")

        for INDEX in ${INDICES[*]}; do
          reindex_index $INDEX
        done


        break
      ;;
      *)
        reindex_index $SELECTED_OPTION
        break
      ;;
    esac
  done

  select_menu
}


function reindex_index() {
  local INDEX="$1"
  local BATCH_SIZE=50

  echo -e "\nReindex $INDEX"
  echo -e "------------------------------------\n"

  vendor/bin/drush search-api:clear $INDEX
  vendor/bin/drush search-api:rebuild-tracker $INDEX
  vendor/bin/drush search-api:index --batch-size=$BATCH_SIZE $INDEX
}

#---------------------------------------------------------------
#                           Main code
#---------------------------------------------------------------

INDICES=$(vendor/bin/drush search-api:list --format=list)

# Build options.
OPTIONS=()
OPTIONS+=('Quit')
OPTIONS+=('All')
for INDEX in ${INDICES[*]}; do
  OPTIONS+=($INDEX)
done

select_menu
