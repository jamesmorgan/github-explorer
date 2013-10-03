CustomCinnamonApplets
=====================

Im learning to hack abit of Cinnamon, hopefully here it starts!

* github-projects - Adding your public GitHub repositories to your Cinnamon desktop, giving you quick access links and stats.
* force-quit = A simple applet to kill a specified window - tutorial: http://cinnamon.linuxmint.com/?p=156
* test-notification = a simple applet which should demonstrate (or find issues) using HTML in notifications

* See [TODO](https://github.com/jamesemorgan/CustomCinnamonApplets/blob/master/github-projects%40morgan-design.com/TODO) for more details

* For issues please report any problems [here](https://github.com/jamesemorgan/CustomCinnamonApplets/issues)

## Installation Cinnamon 1.8+

* Right click on your pannel, click 'Add applets to the pannel'.
* Click on 'Get more online' tab.
* Find 'GitHub Explorer', right click and 'Mark for installation'.
* Once installed 'Configure' and 'Add to pannel'.

## Installation Pre Cinnamon 1.8

* Download version 0.5 from [here](https://github.com/jamesemorgan/CustomCinnamonApplets/blob/master/releases/V0.5-github-projects%40morgan-design.com.zip)
* Place the folder in ~/.local/share/cinnamon/applets/ 
* Right click on the applet to alter settings, adding your username
* Restart Cinnamon or your PC

#### Tested:

* Cinnamon 1.8+ (Minimum version required)
* Linux Mint 15

## Change Log

### V0.9
* Prevent further GitHub query when API query threshold reached, uses X-RateLimit headers
* Improve applet tooltip on API rate exceeded and errors
* Build in verbose Logging for with setting to enable/disable

### V0.8
* Remove old settings files which are not needed
* Optional menu item if no project home found i.e. dont display it if not present
* Last Query Attempt added to tooltip off applet
* Simple logging of Request limits and rates

### V0.7
* Removal of custom settings implementation, now using Cinnamon 1.8 Settings API and hooks as well as adding more settings
* Tweaked conext menu to open new settings
* Refactor of looping code when querying GitHub

### V0.6
* Increased default refresh interval to 3 minutes
* Change default user to 'username' and [myself](https://github.com/jamesemorgan)
* github username link not updated when user changes
* Display popup when no user is set on start
* Dont perform inital lookup request when no user is set
* Refactorings of menu creation logic, method names etc

## Historic Change Log

### V0.5
* Fix missing icon in applet explorer - thanks [maristgeek](https://github.com/maristgeek)
* Improve installation scripts - thanks [magno32](https://github.com/magno32)
* Fix missing user agent string from GitHub API integration - thanks [magno32](https://github.com/magno32)
* General code refactor of error reporting
* Ensure working with Cinnamon 1.8 and Linux Mint 15
* Remove Verbose Logging mode as served little purpose

### V0.4
* On 403 error from GitHub, show error message supplied in alert and not default error message
* Refactor Notifcations and their content
* Minor refactorings, replacement of _this being miss used!
* Enable verbose logging mode via settings, default false

### V0.3-Beta
* Only show failure measssge X 5
* Re-written error message to make sense!
* Correct Icon/Image for settings right click menu

#### Archieved Versions

For use on Cinnamon 1.7 and below please use release V0.5 which can be found within the release folder. 

#### ScreenShot:

![ScreenShot](https://github.com/jamesemorgan/CustomCinnamonApplets/raw/master/screenshots/v0.7-github-explorer.png)
