
## Future Improvements

* Add User authentication as well as using public API feed
* Enable Max height or number of repos to list without scrolling
* Add option for closing secondary open sub menus
* Investigate use of access token instead of using open public API

* Conditional Request based on responses -> http://developer.github.com/v3/#conditional-requests
* Pretty Print date times - http://ejohn.org/projects/javascript-pretty-date/
* Using GitHub V3 OAuth token based authentication
* Notification on new repo added

* Setup custom domain for new site : https://help.github.com/articles/setting-up-a-custom-domain-with-pages

* Create GitHub item object - https://github.com/jonbrett/cinnamon-feeds-applet/blob/master/feedreader.js
* Consider use of lang.Format - https://git.gnome.org/browse/gjs/tree/installed-tests/js/testFormat.js

* Refresh GitHub on internet reconnection from a disconnect
* Ability to have more than one applet running at once? -> https://github.com/linuxmint/Cinnamon/wiki/Applet,%20Desklet%20and%20Extension%20Settings%20Reference#additional-options-in-metadatajson
* Ability to change icon if you don't like the icon supplied as default (see settings example)

* Tool-tips for when rolling over repos giving short description
* Add Language icon & type to repository details -> JSON tag ['language']

* Issue 31 - MultipleAccounts - https://github.com/jamesmorgan/github-explorer/issues/31
 * https://github.com/leafo/fireplace/blob/master/moon/main.moon
* Issue 35 - Option to add Repos Watching - https://github.com/jamesmorgan/github-explorer/issues/35

TODO
* Add applet role registration - see: https://github.com/linuxmint/Cinnamon/blob/master/files/usr/share/cinnamon/applets/network%40cinnamon.org/applet.js (Main.systrayManager.registerRole("network", metadata.uuid);)
* Right click -> Close applet? - Only on version Mint 16 or below?
* Display avatar url for user -> https://api.github.com/users/jamesemorgan
* Correct GitHub Icons & styling - https://octicons.github.com/ & https://github.com/jonbrett/cinnamon-feeds-applet
* Remove old SSH key
* Normalise spelling of GitHub and Github!
* Re-work website
* BUG - fix expand/collapse in cinnamon 2.4+
* BUG - Fix missing icon - check /usr/share/icons && /usr/share/icons/gnome/scalable

## Released Versions

##### V2.0

* Added link to repo wiki if found on request
* Code formatting and style with new IDE
* Ability to install from Mac when running Cinnamon VM
* Add link to download od version ofr cinnamon <2.2
* Re-work README versions and created VERSIONS.md
* Refactor out Notifier
* Refactor out Ticker
* Refactor out SettingsWrapper
* Refactor out raw HTTP calls from GitHub instance

##### V1.5

* Fixed issus 32 - show open issues for each repo in name

##### V1.4

* Created basic blog site - http://jamesemorgan.github.io/github-explorer/
* Renamed project to github-explorer
* Removed old project demos
* Cleaned up README
* Added Watchers link and icon

##### V1.3

* Added indentation thanks to https://github.com/azzazzel

##### V1.2

* Updated to work on Cinnamon 2.0
* Removal of Settings contact menu when running under Cinnamon 2.0+

##### V1.1
* Added ability to create a Gist as default
* Contribution: Removed warnings from Looking Glass, https://github.com/Koutch

##### V1.0
* Basic support of watching changes to repos including number forks, issues and watcher modifcation
* Enable additional notifications with settings, default disabled

##### V0.9
-- Prevent further GitHub query when API query threshold reached, uses X-RateLimit headers
-- Improve applet tool tip on API rate exceeded and errors
-- Build in optional Logging for various testing modes

##### V0.8
-- Remove old settings files which are not needed
-- Optional menu item if no project home found i.e. don't display it if not present
-- Last Query Attempt added to tool tip off applet
-- Simple logging of Request limits and rates
-- Updated README and installation details

##### V0.7
-- New Settings API (Cinnamon 1.8) incorporated, removal of old home brew GTK+ settings as well as revamp of settings functionality - https://github.com/linuxmint/Cinnamon/blob/master/files/usr/share/cinnamon/applets/settings-example%40cinnamon.org/applet.js
-- Include links to home and Github, morgan-design.com
-- Right click context now opens applet configuration settings

##### V0.6

-- Increased default refresh interval to 3 minutes
-- Change default user to 'username' and myself @jamesemorgan
-- github username link not updated when user changes
-- Display popup when no user is set
-- Dont perform inital lookup request when no user is set
-- Small re-factorings of menu creation logic, method names, class format

##### V0.5

-- Fix missing icon in applet explorer - thanks @maristgeek
-- Improve installation scripts - thanks @magno32
-- Fix missing user agent string from GitHub API integration - thanks @magno32
-- General code re-factor of error reporting
-- Ensure working with Cinnamon 1.8 and Linux Mint 15
-- Remove Verbose Logging

##### V0.4
-- On 403 error from GitHub, show error message supplied in alert and not default error message
-- Re-factor Notifications and their content
-- Minor re-factorings, replacement of this being miss used!
-- Enable verbose logging mode via settings, default false

##### V0.3
-- Only show failure message X 5
-- Re-written error message to make sense!
-- Correct Icon/Image for settings right click menu

##### V0.2
-- Add Settings Menu so users dont have to edit .js file using Gtk glade
-- Added version to metadata.json
-- Add notifications for set-up attempt, first successful load & failure to find repos

##### V0.1
-- First release