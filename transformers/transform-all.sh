#!/usr/bin/env bash

set -e

_dir=$(cd $(dirname $BASH_SOURCE[0]) && pwd)
cd "$_dir/.."

"$_dir/gis/split.sh"

"$_dir/sort/sort.sh"

php transformers/osm/split.php
