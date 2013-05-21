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

### V 0.5
* Fix missing icon in applet explorer - thanks @maristgeek
* Improve installation scripts - thanks @magno32
* Fix missing user agent string from GitHub API integration - thanks @magno32

### V0.4
* On 403 error from GitHub, show error message supplied in alert and not default error message
* Refactor Notifcations and their content
* Minor refactorings, replacement of _this being miss used!
* Enable verbose logging mode via settings, default false

### V0.3-Beta
* Only show failure measssge X 5
* Re-written error message to make sense!
* Correct Icon/Image for settings right click menu

### V0.2-Beta

#### Tested:

* Cinnamon 1.6.7
* Linux Mint 14

#### ScreenShot:

![ScreenShot](https://github.com/jamesemorgan/CustomCinnamonApplets/raw/master/screenshots/v0.2-github-explorer.png)
