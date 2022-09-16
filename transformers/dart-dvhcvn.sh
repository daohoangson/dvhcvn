#!/usr/bin/env bash

set -euo pipefail

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_dataDir="$_dir/../data"
_datePath="$_dataDir/date.txt"
_jsonPath="$_dataDir/dvhcvn.json"
_dartPath="$_dir/dart-dvhcvn"
_dataDartPath="$_dartPath/lib/src/data.dart"

if [ ! -f $_datePath ]; then
  echo "$_datePath does not exist!" >&2
  exit 1
fi
_date=$( cat $_datePath )
_dateVersion=$( cat $_datePath | tr '/' " " | awk '{ for (i=NF; i>1; i--) printf("%s ",$i); print $1; }' | sed 's# ##g' )

{ \
  echo 'name: dvhcvn'; \
  echo "version: 2.0.$_dateVersion"; \
  echo "description: \"Three tiers of Vietnam's administrative units (last update: $_date)\""; \
  echo 'homepage: https://github.com/daohoangson/dvhcvn'; \
  echo ''; \
  echo 'environment:'; \
  echo '  sdk: ">=2.12.0 <3.0.0"'; \
  echo ''; \
  echo 'dev_dependencies:'; \
  echo '  lint: ^1.7.2'; \
  echo '  test:'; \
} >"$_dartPath/pubspec.yaml"
echo 'Generated pubspec'

if [ ! -f $_jsonPath ]; then
  echo "$_jsonPath does not exist!" >&2
  exit 1
fi

dart "$_dir/dart-dvhcvn/bin/generate.dart" $_jsonPath >$_dataDartPath
echo 'Generated OK'

dart format $_dataDartPath

( \
  cd  "$_dir/dart-dvhcvn" && \
  dart pub get && \
  dart analyze && \
  dart run test \
)
