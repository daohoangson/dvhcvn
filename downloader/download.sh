#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

_gsoPath='data/dvhcvn.json'
_gsoDatePath='data/date.txt'
_gisPath='data/gis.json'

# 895/NQ-UBTVQH14 @ https://www.gso.gov.vn/dmhc2015/NghiDinh.aspx
_date=01/03/2020

if [ ! -f $_gsoPath ]; then
  echo "Generating $_gsoPath..."
  php "$_dir/01_gso.gov.vn.php" $_date >$_gsoPath
  echo $_date >$_gsoDatePath
fi

if [ ! -f $_gisPath ]; then
  echo "Generating $_gisPath..."
  php "$_dir/02_gis.chinhphu.vn.php" <$_gsoPath >$_gisPath
fi
