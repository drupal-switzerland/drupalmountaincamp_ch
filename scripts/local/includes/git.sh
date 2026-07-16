#!/bin/bash

git_check_if_global_gitconfig_exists() {

	if file_exists ~/.gitconfig; then
    return 0
  fi

  return 1
}

git_check_for_global_user_name () {

  local VALUE=$(git config --global --get user.name)

  if [ "$VALUE" != '' ]; then
    return 0
  fi

  return 1
}

git_check_for_global_user_email () {
  
  local VALUE=$(git config --global --get user.email)

  if [ "$VALUE" != '' ]; then
    return 0
  fi

  return 1
}

git_init_config() {

  #Input and set of user.name
  echo -n "Please enter your first and last name: "
  read -e FULLNAME
  git config --global user.name "$FULLNAME"

  #Input and set of user.email
  echo -n "Please enter your Email Address: "
  read -e EMAIL
  git config --global user.email "$EMAIL"
}

git_delete_local_branch() {
  git branch -D $1
}

git_delete_remote_branch() {
  git push origin --delete $1
}