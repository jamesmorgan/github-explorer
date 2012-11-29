#!/bin/bash

pluginDir=/home/james/.local/share/cinnamon/applets/force-quit@cinnamon.org
echo "The value of \"pluginDir\" is $pluginDir."

if [  -d "$pluginDir" ]; then
	echo "Making DIR"
	mkdir "$pluginDir"
fi

echo "Copying Plugin"
cp -r force-quit@cinnamon.org/* "$pluginDir"
