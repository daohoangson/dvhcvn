#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_gsoPath='data/dvhcvn.json'
_gisPath='data/gis.json'

if [ ! -f $_gsoPath ]; then
  echo "Generating $_gsoPath..."
  php "$_dir/01_gso.gov.vn.php" >$_gsoPath
fi

if [ ! -f $_gisPath ]; then
  echo "Generating $_gisPath..."
  php "$_dir/02_gis.chinhphu.vn.php" <$_gsoPath >$_gisPath

  echo "Compressing $_gisPath..."
  gzip --best --force --keep $_gisPath
fi
