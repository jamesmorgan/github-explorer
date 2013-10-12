#!/bin/bash

pluginDir=~/.local/share/cinnamon/applets/github-projects@morgan-design.com


function usage_and_exit()
{
    echo "missing a required parameter (version)"
    echo "Add: $0 -v <version>"
    exit 1;
}

while getopts "v:" flag; do
    case "${flag}" in
        v)
            VERSION=${OPTARG}
            echo "Found Version [${VERSION}]"
            ;;
        *)
            usage_and_exit
            ;;
    esac
done
shift $((OPTIND-1))

if [[ -z "${VERSION}" ]];
then
    usage_and_exit
fi

echo "Checking current version"

echo "Replace new version"

echo "Zip up directory"


