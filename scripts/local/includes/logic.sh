#!/bin/bash

prompt_yes_no () {
 
  #echo -e "\n"
  ask_question "$1 (y/n)"
  read answer
    
  if [ "$answer" == "y" ]; then 
    return 0
  elif [ "$answer" == "n" ]; then
    return 1
  else 
    echo invalid option
    prompt_yes_no "Please type in either 'y' or 'n'. "
  fi 
  
}

press_any_key() {
  read -n 1 -s -r -p "Press any key to continue"
}