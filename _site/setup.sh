#!/bin/bash

## Instal rvm to to manage ruby install
curl -L https://get.rvm.io | bash -s stable --ruby

## source rvm
source /home/jimbob/.rvm/scripts/rvm

## installing bundler
gem install bundler

## To install github-pages gem
gem install github-pages

## jekyll needed for hosting locally
gem install jekyll

## To update github-pages gem
#gem update github-pages