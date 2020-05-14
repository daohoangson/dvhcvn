#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_gsoPath='data/dvhcvn.json'
_gsoDatePath='data/date.txt'
_gisPath='data/gis.json'
_postcodePath='data/postcode.json'
_postcodeTmpPath='data/postcode.tmp.json'

# 931/NQ-UBTVQH14 @ https://www.gso.gov.vn/dmhc2015/NghiDinh.aspx
_date=01/06/2020

if [ ! -f $_gsoPath ]; then
  echo "Generating $_gsoPath..."
  php "$_dir/01_gso.gov.vn.php" $_date >$_gsoPath
  echo $_date >$_gsoDatePath
fi

if [ ! -f $_gisPath ]; then
  echo "Generating $_gisPath..."
  php "$_dir/02_gis.chinhphu.vn.php" <$_gsoPath >$_gisPath
fi

if [ ! -f $_postcodePath ]; then
  echo "Generating $_postcodePath..."
  php "$_dir/03_mabuuchinh.vn.php" <$_gsoPath >$_postcodePath
else
  echo "Updating $_postcodePath..."
  php "$_dir/03_mabuuchinh.vn.php" $_postcodePath <$_gsoPath >$_postcodeTmpPath
  mv -f $_postcodeTmpPath $_postcodePath
fi
