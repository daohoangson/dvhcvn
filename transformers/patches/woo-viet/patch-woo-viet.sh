#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_sortedPath='data/sorted.json'

if [ ! -f $_sortedPath ]; then
  echo "$_sortedPath does not exist!" >&2
  exit 1
fi

exec php "$_dir/patch-woo-viet.php" <$_sortedPath
