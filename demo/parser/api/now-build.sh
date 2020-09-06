#!/usr/bin/env bash

set -e
cd $( dirname $BASH_SOURCE[0] )

_historyDataPath=../../../history/data
_treeJsonPath=$_historyDataPath/tree.json

mkdir -p $_historyDataPath

if [ ! -f $_treeJsonPath ]; then
  curl -Lo $_treeJsonPath https://github.com/daohoangson/dvhcvn-historical-data/raw/demo/parser/tree.json
fi

ls -ald $_treeJsonPath
