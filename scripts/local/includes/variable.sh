#!/bin/bash

is_var_set(){
  local v="$1"
  if [[ ! ${!v} && ${!v-unset} ]]; then
    return 1
  else 
    return 0
  fi
}


is_var_empty(){
  local var_name="$1"    

  if ! is_var_set $var_name; then
    #display_error_message "$var_name does NOT exist"
    #echo "$var_name: ${!var_name}"
    return 0
  else 
    #debug "$var_name DOES exist"
    
    if [[ "${!var_name}" == '' ]]; then
      #display_error_message "$var_name is empty :("
      return 0
    else
      #debug "$var_name has the value of ${!var_name}" 
      return 1
    fi
  fi
}