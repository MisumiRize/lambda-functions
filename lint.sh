#!/bin/bash

set -eux

dirs=`find . -type d -not -name .git -not -name . -maxdepth 1`
res=0

for dir in $dirs; do
  cd $dir

  set +e
  npm run lint
  code=$?
  set -e

  if [ $code -ne 0 ]; then
    res=$code
  fi

  cd ../
done

exit $res
