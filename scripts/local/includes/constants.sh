#!/bin/bash

#Current Directory you are in
CURRENT_DIR=$(pwd)

#The current user
CURRENT_USER=$(whoami)

#This strings sets the History Control of a CLI so no command 
#leading space gets saved into the history. For example: ' ssh user@host'
CMD_NOHIST='export HISTCONTROL=ignorespace'


#Color constants
COLOR_BLACK_BOLD="\033[30m"
COLOR_BLACK="\033[0m"
COLOR_RED="\033[31m"
COLOR_RED_BOLD="\033[1;31m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_BLUE="\033[34m"
COLOR_MAGENTA="\033[35m"
COLOR_CYAN="\033[36m"
COLOR_WHITE="\033[37m"