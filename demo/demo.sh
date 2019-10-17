#!/usr/bin/env bash

set -e

_dir=$( cd $( dirname $BASH_SOURCE[0] ) && pwd )

exec docker run --rm \
  -p 80:80 \
  -v "$_dir:/usr/share/nginx/html" \
  -v "$_dir/../data:/usr/share/nginx/html/data" \
  nginx
