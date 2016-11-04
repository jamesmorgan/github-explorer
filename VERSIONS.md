GitHub Explorer
=====================

More information visit the [Github Page](http://jamesmorgan.github.io/github-explorer/)

#### V2.0

* TODO

#### V1.5
* Show open issues for each repository within the name, includes options, default enabled - #32

#### V1.4
* Added link to view watchers with icon
* Created simple [github page](http://jamesmorgan.github.io/github-explorer/)
* Renamed repository to `github-explorer`

#### V1.3
* Indentation added to nested menu elements, thanks [@azzazzel](https://github.com/azzazzel)

#### V1.2
* Tested on Cinnamon 2.0+
* Removed Settings context menu link if running on Cinnamon 2.0+

#### V1.1
* Added ability to create a Gist as default
* Contribution: Removed warnings from Looking Glass, thanks [@Koutch](https://github.com/Koutch)

#### V1.0
* Basic support of watching changes to repos and notification of alerts
* Enable additional notifications with settings, default disabled

#### V0.9
* Prevent further GitHub query when API query threshold reached, uses X-RateLimit headers
* Improve applet tooltip on API rate exceeded and errors
* Build in verbose Logging for with setting to enable/disable

#### V0.8
* Remove old settings files which are not needed
* Optional menu item if no project home found i.e. dont display it if not present
* Last Query Attempt added to tooltip off applet
* Simple logging of Request limits and rates

#### V0.7
* Removal of custom settings implementation, now using Cinnamon 1.8 Settings API and hooks as well as adding more settings
* Tweaked context menu to open new settings
* Refactor of looping code when querying GitHub

#### V0.6
* Increased default refresh interval to 3 minutes
* Change default user to 'username' and [@myself](https://github.com/jamesmorgan)
* Github username link not updated when user changes
* Display popup when no user is set on start
* Dont perform inital lookup request when no user is set
* Refactorings of menu creation logic, method names etc

## Historic Change Log

#### V0.5
* Fix missing icon in applet explorer - thanks [@maristgeek](https://github.com/maristgeek)
* Improve installation scripts - thanks [@magno32](https://github.com/magno32)
* Fix missing user agent string from GitHub API integration - thanks [@magno32](https://github.com/magno32)
* General code refactor of error reporting
* Ensure working with Cinnamon 1.8 and Linux Mint 15
* Remove Verbose Logging mode as served little purpose

#### V0.4
* On 403 error from GitHub, show error message supplied in alert and not default error message
* Re-factor Notifications and their content
* Minor re-factorings, replacement of this being miss used!
* Enable verbose logging mode via settings, default false

#### V0.3-Beta
* Only show failure message X 5
* Re-written error message to make sense!
* Correct Icon/Image for settings right click menu

#### Archived Versions

For use on Cinnamon 1.7 and below please use release V0.5 which can be found within the release folder. 