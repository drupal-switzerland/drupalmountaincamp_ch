#!/bin/bash

directory_exists(){

  if [[ -d $1 ]] && [[ -n $1 ]] ; then
      return 0
  else
      return 1
  fi

}

is_directory() {
   if [[ -d $1 ]]  ; then
      return 0
  else
      return 1
  fi 
}

copy_directory() {
  local SOURCE=$1
  local TARGET=$2

  cp -R $SOURCE $TARGET
}

create_and_check_directory() {

  local DIR="$1"

  if ! directory_exists "$DIR"; then

    if ! mkdir -p "$DIR"; then
      return 1
    fi

    return 0
  else
    return 0
  fi

}