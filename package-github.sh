#!/bin/bash

APPLET_NAME="github-projects@morgan-design.com"

WORKING_DIR="/mnt/750-SpinPoint-A/Dropbox/workspace-gnome/github-explorer"
RELEASE_DIR="${WORKING_DIR}/releases"
PROJECT_DIR="${WORKING_DIR}/github-projects@morgan-design.com"

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
            echo "Using Version [${VERSION}]"
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

TAG_VERISON="V${VERSION}"

function checkForDuplicateTag {

	echo "Checking current version $TAG_VERISON"

	FOUND=$(git tag --list | grep $TAG_VERISON)

	if [ "${FOUND}" == "${TAG_VERISON}" ]; then
		echo "EXITING - Found Existing Version $TAG_VERISON"
  		exit 1;
	fi
}

ZIP_NAME="${TAG_VERISON}-${APPLET_NAME}"
ZIP_FILE="${ZIP_NAME}.zip"

function packageZip {
	echo "Moving to $PROJECT_DIR"
	cd $PROJECT_DIR

	echo "Packaging up ZIP - ${APPLET_NAME}"
	zip -r $ZIP_FILE . -i '*.js' '*.json' '*.png' '*.md'

	echo "Copy to releases dir"
	cp -f $ZIP_FILE "${RELEASE_DIR}/${ZIP_NAME}.zip"

	mv $ZIP_FILE "${WORKING_DIR}/${APPLET_NAME}.zip"
	cd $WORKING_DIR
}

function createTag {
	echo "Creating Tag ${TAG_VERISON}"

	git tag $TAG_VERISON

	echo "Pusing tag to repo"
	# You can delete by removing local tag and pushin to origin git push origin :refs/tags/V1.3
	git push --tags
}


function addAllFiles {
	echo "Adding all files to Git"
	git add -A

	echo "Commiting All Files to Git"

	git commit -m"Releasing ${TAG_VERISON}"
	git push
}

checkForDuplicateTag;
packageZip;
addAllFiles;
createTag;
