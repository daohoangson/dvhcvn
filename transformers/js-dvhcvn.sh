#!/usr/bin/env bash

set -euo pipefail

_dir=$(cd $(dirname $BASH_SOURCE[0]) && pwd)

_dataDir="$_dir/../data"
_datePath="$_dataDir/date.txt"
_jsPath="$_dir/js-dvhcvn"
_packageJsonPath="$_jsPath/package.json"

if [ ! -f $_datePath ]; then
  echo "$_datePath does not exist!" >&2
  exit 1
fi
_date=$(cat $_datePath)
_dateVersion=$(cat $_datePath | tr '/' " " | awk '{ for (i=NF; i>1; i--) printf("%s ",$i); print $1; }' | sed 's# ##g')

_packageJson=$(cat $_packageJsonPath)
echo "$_packageJson" |
  jq ".version = \"1.1.$_dateVersion\"" |
  jq ".description = \"Three tiers of Vietnam's administrative units (last update: $_date)\"" |
  tee $_packageJsonPath

(
  cd "$_jsPath" &&
    rm -rf ./lib &&
    npm install &&
    npm run build
)
