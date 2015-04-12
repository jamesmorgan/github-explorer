#!/bin/bash

pluginDir=/Users/jamesmorgan/Documents/vm-linuxmint-cinnamon-shared-folder/
echo "The value of \"pluginDir\" is $pluginDir."

echo "Copying To DropBox Shared "
cp -fr github-projects@morgan-design.com $pluginDir
cp -fr install_github_projects.sh $pluginDir
