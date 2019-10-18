#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_inputPath='data/dvhcvn.json'
_outputPath='data/sorted.json'

if [ ! -f $_inputPath ]; then
  echo "$_inputPath does not exist!" >&2
  exit 1
fi

rm -f $_outputPath

echo "Generating $_outputPath..."
python3 "$_dir/sort.py" <$_inputPath >$_outputPath
