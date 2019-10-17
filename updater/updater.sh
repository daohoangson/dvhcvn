#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_fullJson='data/full.json'
_gisJson='data/gis.json'

if [ ! -f $_fullJson ]; then
  echo "Generating $_fullJson..."
  php "$_dir/01_dmhc2015.php" >$_fullJson
fi

if [ ! -f $_gisJson ]; then
  echo "Generating $_gisJson..."
  php "$_dir/02_gis.php" <$_fullJson >$_gisJson

  echo "Compressing $_gisJson..."
  gzip --best --force --keep $_gisJson
fi
