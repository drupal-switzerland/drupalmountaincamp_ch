#!/bin/bash

print_script_header() {

  echo -e "\n"
  echo -e "**********************************"
  echo $1
  echo -e "**********************************"
}

print_separator () {
  echo -e "\n"
  echo -e "$1"
  echo -e "-------------------------$COLOR_BLACK"
}

print_section() {
  echo -e "\n\n################ $1 ###############\n"
}

print_step_group_title () {
  echo -e "\n"
  echo "$1...."
}

print_substep() {
  echo -e " - $1...."
}

print_action_title() {
  echo -e "\n"
  echo $1
  echo -e "**************************"
}

ask_question () {
  echo -en "$COLOR_MAGENTA(?) $COLOR_BLACK$1 "
}

display_info_message() {
  echo -e "$COLOR_CYAN""(i) Info: $COLOR_BLACK$1"
}

display_info_message_oneline() {
  echo -en "$COLOR_CYAN""(i) Info: $COLOR_BLACK$1"
}

display_warning () {
  print_yellow "$COLOR_YELLOW(!) WARNING: $1$COLOR_BLACK"
}

display_important () {
  echo -e "$COLOR_YELLOW(!) Important: $1$COLOR_BLACK"
}

display_confirmation_message() {
  echo -e "$COLOR_GREEN$1$COLOR_BLACK"
}

display_error_message() {
  echo -e "$COLOR_RED$1$COLOR_BLACK"
}

debug() {
  echo -e "\n$COLOR_CYAN""DEBUG: $1$COLOR_BLACK"
}

print_green() {
  echo -e "$COLOR_GREEN$1$COLOR_BLACK"
}

print_red() {
  echo -e "$COLOR_RED$1$COLOR_BLACK"
}

print_yellow() {
  echo -e "$COLOR_YELLOW$1$COLOR_BLACK"
}

print_ok () {
  print_green "ok"
}

print_done () {
  print_green "done"
}

display_padded_text () {
  printf "%-$1s" "$2"
}

display_server_result() {
  echo -e "\nResult from server:"
  echo "---------------------------------------------"
  echo -e "\n$1"
  echo "---------------------------------------------"

}

display_password() {

  local PASS=$1

  if [ "$PASS" != '' ]; then
    display_info_message "Password: $PASS"
  fi

}

new_line() {
  echo ""
}

display_command () {
  display_info_message "Running command: $COLOR_MAGENTA$1$COLOR_BLACK"
}
