#!/bin/bash

pluginDir=~/.local/share/cinnamon/applets/test-notification@morgan-design.com
echo "The value of \"pluginDir\" is $pluginDir."

echo "Removing old plugin"
rm -r $pluginDir

echo "Copying Plugin"
cp -fr test-notification@morgan-design.com "$pluginDir"
