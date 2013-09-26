CustomCinnamonApplets
=====================

Im learning to hack abit of Cinnamon, hopefully here it starts!

* github-projects - Adding your public GitHub repositories to your Cinnamon desktop, giving you quick access links and stats.
* force-quit = A simple applet to kill a specified window - tutorial: http://cinnamon.linuxmint.com/?p=156

* See [TODO](https://github.com/jamesemorgan/CustomCinnamonApplets/blob/master/github-projects%40morgan-design.com/TODO) for more details

## Installation

* Place the folder in ~/.local/share/cinnamon/applets/ 
* Right click on the applet to alter settings, adding your username
* Restart Cinnamon or your PC

## GitHub Projects

### V0.6
* Increased default refresh interval to 3 minutes
* Change default user to 'username' and [myself](https://github.com/jamesemorgan)
* github username link not updated when user changes
* Display popup when no user is set on start
* Dont perform inital lookup request when no user is set
* Refactorings of menu creation logic, method names etc

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

#### Tested:

* Cinnamon 1.8.0
* Linux Mint 15

#### ScreenShot:

![ScreenShot](https://github.com/jamesemorgan/CustomCinnamonApplets/raw/master/screenshots/v0.2-github-explorer.png)
