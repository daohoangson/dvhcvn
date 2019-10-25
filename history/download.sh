#!/usr/bin/env bash

set -e
cd $( dirname $BASH_SOURCE[0] )

_scriptPath=./data/tmp.sh

echo Generating an execution plan...
npm install >./logs/npm-install.txt 2>./logs/npm-install.log
node ./planner.js >$_scriptPath

echo Running $_scriptPath...
bash $_scriptPath

echo Cleaning up...
rm -f $_scriptPath

echo Done
