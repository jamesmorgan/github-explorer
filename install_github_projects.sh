#!/bin/bash

pluginDir=~/.local/share/cinnamon/applets/github-projects@morgan-design.com
echo "The value of \"pluginDir\" is $pluginDir."

echo "Removing old plugin"
rm -r "$pluginDir"

echo "Copying Plugin"
cp -fr github-projects@morgan-design.com $pluginDir
