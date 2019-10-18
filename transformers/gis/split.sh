#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_jsonPath='data/gis.json'
_outDirPath='data/gis'

if [ ! -f $_jsonPath ]; then
  echo "$_jsonPath does not exist!" >&2
  exit 1
fi

if [ -d $_outDirPath ]; then
  rm -rf $_outDirPath
fi
mkdir -p $_outDirPath

echo "Generating $_outDirPath/*.json..."
php "$_dir/split.php" $_outDirPath <$_jsonPath

ls -al $_outDirPath | wc -l
