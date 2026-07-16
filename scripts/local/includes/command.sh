#!/bin/bash

command_exists() {

  if which $1 > /dev/null; then
    return 0
  fi

  return 1
}