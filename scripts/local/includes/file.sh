#!/bin/bash

file_exists () {
  local FILE_TO_CHECK="$1"
  
  #echo "File to check: $1"
  
  if [ -f "$FILE_TO_CHECK" ]
  then
    #echo “$FILE_TO_CHECK file exists!”
    return 0
  else
    #echo “$FILE_TO_CHECK file not found!”
    return 1
  fi 
  
}

file_copy_verbose() {

  local SOURCE=$1
  local TARGET=$2

  cp -v "$SOURCE" "$TARGET"
}

file_delete () {

  if file_exists "$1"; then
    rm $1
  fi

}

file_is_symlink () {

  local FILE_TO_CHECK=$1

  if [ -h $FILE_TO_CHECK ]; then
    return 0
  else
    return 1
  fi

}

file_remove_symlink() {

  local FILE_PATH="$1"

  if file_is_symlink "$FILE_PATH"; then
    rm $FILE_PATH
  fi
}

file_load() {
  local FILE_PATH="$1"

  if source "$FILE_PATH"; then
    return 0
  fi

  return 1
}

file_is_file_or_symlink () {

  local FILE_TO_CHECK=$1

  if file_exists $FILE_TO_CHECK || file_is_symlink $FILE_TO_CHECK; then
    return 0
  else
    return 1
  fi

}

file_overwrite_prompt() {

  local SOURCE=$1
  local TARGET=$2

  if file_exists $TARGET; then

    if prompt_yes_no "$COLOR_GREEN$TARGET$COLOR_BLACK already exists. Overwrite with $COLOR_CYAN$SOURCE$COLOR_BLACK?"; then
      file_copy_verbose $SOURCE $TARGET
    fi

  else
    file_copy_verbose $SOURCE $TARGET
  fi


}

file_replace_modified_file() {

  local SOURCE=$1
  local TARGET=$2

  # Check if file exists already
  if file_exists "$TARGET"; then

    # Display warning for modified target file.
    if cmp -s "$SOURCE" "$TARGET"; then
      file_copy_verbose "$SOURCE" "$TARGET"
    else
      display_warning "$TARGET has been modified."
      file_overwrite_prompt "$SOURCE" "$TARGET"
    fi
  else
    file_copy_verbose "$SOURCE" "$TARGET"
  fi

}

file_replace_diffed_file() {

  local SOURCE=$1
  local TARGET=$2

  # Check if file exists already.
  if file_exists "$TARGET"; then

    # If the diff command exists, then display changes.
    if command_exists diff; then

      CHANGES=$(diff -u "$TARGET" "$SOURCE" | cat)

      if [ "$CHANGES" != '' ]; then
        echo "$CHANGES"
        display_warning "$TARGET has been modified. You can see the difference above."
      else
        display_info_message "$TARGET: No changes have been found."
      fi
    else
      display_warning "The 'diff' command does not exist. Therefore no file difference can be shown."
    fi

    # Prompt to replace file.
    file_overwrite_prompt "$SOURCE" "$TARGET"
  else
    file_copy_verbose "$SOURCE" "$TARGET"
  fi

}
