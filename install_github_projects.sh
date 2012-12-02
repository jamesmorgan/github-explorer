#!/bin/bash

pluginDir=/home/james/.local/share/cinnamon/applets/github-projects@morgan-design.com
echo "The value of \"pluginDir\" is $pluginDir."

rm -r "$pluginDir"
mkdir "$pluginDir"

echo "Copying Plugin"
cp -fr github-projects@morgan-design.com/* /home/james/.local/share/cinnamon/applets/github-projects@morgan-design.com
