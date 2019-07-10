#!/bin/bash

fatal() {
    echo "$1"
    exit 1
}

version=${1/v/}
if [[ "$version" == "" ]]; then
    fatal "usage: $0 <version>"
fi

which json || fatal "Please install the json tool ('npm install -g json')"

set -e

# Start from the root of the repo
root=`git rev-parse --show-toplevel`
cd $root

echo "Setting up build directory..."
build_dir=${root}/dist/build
rm -rf ${build_dir}
mkdir -p ${build_dir}

echo "Extracting source tree..."
git archive HEAD | tar -x -C ${build_dir}
cp _release/* ${build_dir}/_release  # makes things easier while developing release process

cd ${build_dir}

# cron doesn't like it when this is writeable by anyone other than the
# owner.
chmod 644 _release/cacophony-api-prune-objects

echo "Setting versions..."
perl -pi -e "s/^version:.+/version: \"${version}\"/" _release/nfpm.yaml
json -I -f package.json -e "this.version=\"${version}\""
json -I -f package-lock.json -e "this.version=\"${version}\""

nfpm -f _release/nfpm.yaml pkg -t ../cacophony-api_${version}.deb
