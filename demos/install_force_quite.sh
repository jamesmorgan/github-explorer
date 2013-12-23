#!/bin/bash

pluginDir=~/.local/share/cinnamon/applets/force-quit@cinnamon.org
echo "The value of \"pluginDir\" is $pluginDir."

echo "Removing old plugin"
rm -r $pluginDir

echo "Copying Plugin"
cp -fr force-quit@cinnamon.org "$pluginDir"
