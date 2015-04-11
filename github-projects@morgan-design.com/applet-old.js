/** Allows import of other files e.g. const GitHub=imports.github; = github.js */
imports.searchPath.push(imports.ui.appletManager.appletMeta["github-projects@morgan-design.com"].path);

/** Imports START **/
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;
const Cinnamon = imports.gi.Cinnamon;
const St = imports.gi.St;
const Gtk = imports.gi.Gtk;

const Applet = imports.ui.applet;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

const Tooltips = imports.ui.tooltips;
const Settings = imports.ui.settings;

const Notify = imports.gi.Notify;

const CinnamonVersion = imports.misc.config.PACKAGE_VERSION;

/** Imports END **/

/** Custom Files START **/
const GitHub = imports.github;
const Logger = imports.logger;
/** Custom Files END **/

const APPLET_ICON = global.userdatadir + "/applets/github-projects@morgan-design.com/icon.png";

const NotificationMessages = {
    AttemptingToLoad: { title: "GitHub Explorer", content: "Attempting to Load your GitHub Repos" },
    SuccessfullyLoaded: { title: "GitHub Explorer", content: "Successfully Loaded GitHub Repos for user ", append: "USER_NAME" },
    ErrorOnLoad: { title: "ERROR:: GitHub Explorer ::ERROR", content: "Failed to load GitHub Repositories! Check applet Configuration" }
};

// Simple space indents
const L1Indent = "  ";
const L2Indent = "    ";

const Config = {
    show_issues_icon_on_repo_name: true
};

/* Application Hook */
function main(metadata, orientation, instance_id) {
    let myApplet = new MyApplet(metadata, orientation, instance_id);
    return myApplet;
}

/* Constructor */
function MyApplet(metadata, orientation, instance_id) {
    this._init(metadata, orientation, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function (metadata, orientation, instance_id) {

        Applet.IconApplet.prototype._init.call(this, orientation, instance_id);

        this.metadata = metadata;

        this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);

        this._reloadGitHubFeedTimerId = 0;
        this._shouldDisplayLookupNotification = true;

        try {
            this.set_applet_icon_path(APPLET_ICON);

            this.settings.bindProperty(Settings.BindingDirection.IN,// The binding direction - IN means we only listen for changes from this applet
                "username",                                         // The setting key, from the setting schema file
                "username",                                         // The property to bind the setting to - in this case it will initialize this.icon_name to the setting value
                this.on_settings_changed,                           // The method to call when this.icon_name has changed, so you can update your applet
                null);                                              // Any extra information you want to pass to the callback (optional - pass null or just leave out this last argument)

            this.settings.bindProperty(Settings.BindingDirection.IN, "enable-auto-refresh", "enable_auto_refresh", this.on_settings_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "enable-verbose-logging", "enable_verbose_logging", this.on_settings_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "enable-github-change-notifications", "enable_github_change_notifications", this.on_settings_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "refresh-interval", "refresh_interval", this.on_settings_changed, null);
            this.settings.bindProperty(Settings.BindingDirection.IN, "show-issues-icon-on-repo-name", "show_issues_icon_on_repo_name", this.on_settings_changed, null);

            // Set version from metadata
            this.settings.setValue("applet-version", metadata.version);

            // Default set config so we know if things change later
            Config.show_issues_icon_on_repo_name = this.settings.getValue("show-issues-icon-on-repo-name");

            let self = this;

            this.logger = new Logger.Logger({
                uuid: this.metadata.uuid,
                verboseLogging: this.settings.getValue("enable-verbose-logging")
            });

            this.logger.debug("Cinnamon Version : " + CinnamonVersion);

            this._maincontainer = new St.BoxLayout({name: 'repocontainer', vertical: true});//, reactive:true, track_hover:true
            this._notificationbin = new St.BoxLayout({vertical:true});

            this.menu_label = new PopupMenu.PopupMenuItem("GitHub Explorer!");
            this.menu_label.actor.reactive = true;
            this.menu_label.actor.can_focus = true;
            this.menu_label.label.add_style_class_name('popup-subtitle-menu-item');

            this.clear_separator = new PopupMenu.PopupSeparatorMenuItem();
            this.clear_action = new PopupMenu.PopupMenuItem(_("Clear notifications"));
            this.clear_action.connect('activate', Lang.bind(this, function () {
                self.logger.debug('CLICKED CLEAR!');
            }));
            this.clear_action.actor.show(); // show()/hide() Item

            if (this.menu) {
                this.menu.destroy();
            }
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menu.addMenuItem(this.menu_label);
            this.menu.addActor(this._maincontainer);
            this.menu.addMenuItem(this.clear_separator);
            this.menu.addMenuItem(this.clear_action);

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menuManager.addMenu(this.menu);

            this.scrollview = new St.ScrollView({ x_fill: true, y_fill: true, y_align: St.Align.START, style_class: "vfade"});
            this._maincontainer.add(this.scrollview);
            this.scrollview.add_actor(this._notificationbin);
            this.scrollview.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);

            let vscroll = this.scrollview.get_vscroll_bar();
            vscroll.connect('scroll-start', Lang.bind(this, function() {
                self.menu.passEvents = true;
            }));
            vscroll.connect('scroll-stop', Lang.bind(this, function() {
                self.menu.passEvents = false;
            }));

            for (i = 0; i < 40; i++) {
                // Main Menu Item
                let menuItem1 = new PopupMenu.PopupSubMenuMenuItem("Sub Menu");
                let imgSubMenuItem1 = this._createPopupImageMenuItem("Image Sub Menu Item 1", "web-browser-symbolic", function () {
                    self.logger.debug("Clicked!");
                });
                let imgSubMenuItem2 = this._createPopupImageMenuItem("Image Sub Menu Item 2", "web-browser-symbolic", function () {
                    self.logger.debug("Clicked!");
                });
//                openRepoItem.actor._parent_container = this._maincontainer;
                menuItem1.actor.reactive = true;
                menuItem1.actor.can_focus = true;
                menuItem1.menu.addMenuItem(imgSubMenuItem1);
                menuItem1.menu.addMenuItem(imgSubMenuItem2);

                this._notificationbin.add(menuItem1.actor);
                menuItem1.actor._parent_container = this._notificationbin;
            }


            // Menu setup
//            this.menu = new Applet.AppletPopupMenu(this, orientation);
//            this.menuManager = new PopupMenu.PopupMenuManager(this);
//            this.menuManager.addMenu(this.menu);
//            this.menuManager.addMenu(new Applet.AppletPopupMenu(this, orientation));

            this._setUpUsers();

//            // Create and Setup new GitHub object
//            this.gh = new GitHub.GitHub({
//                username: this.settings.getValue("username"),
//                version: this.metadata.version,
//                logger: this.logger
//            });
//
//            // Handle failures
//            this.gh.onFailure(function (status_code, error_message) {
//                self._handleGitHubErrorResponse(status_code, error_message);
//            });
//
//            // Handle success
//            this.gh.onSuccess(function (jsonData) {
//                self._handleGitHubSuccessResponse(jsonData);
//            });
//
//            // Handle repo change events
//            this.gh.onRepositoryChangedEvent(function (changeEvent) {
//                self._handleRepositoryChangedEvent(changeEvent);
//            });

            // Add Settings menu item if not running cinnamon 2.0+
            if (parseInt(CinnamonVersion) == 1) {
                let settingsMenu = new PopupMenu.PopupImageMenuItem("Settings", "preferences-system-symbolic");
                settingsMenu.connect('activate', Lang.bind(this, function () {
                    self._openSettingsConfiguration();
                }));
                this._applet_context_menu.addMenuItem(settingsMenu);
            }

            // If no username set, launch configuration options and tell the user
            if (this.settings.getValue("username") === undefined || this.settings.getValue("username") === "") {
                this._openSettingsConfiguration();
                this.set_applet_tooltip(_("Check Applet Configuration"));
                this._displayErrorNotification(NotificationMessages['ErrorOnLoad']);
            } else {
                // Make first GitHub lookup and trigger ticking timer!
//                this._startGitHubLookupTimer()
            }
        }
        catch (e) {
            if (this.logger != undefined) {
                this.logger.error(e);
            } else {
                global.logError(e);
            }
        }
    },

    on_applet_clicked: function (event) {
        this.menu.toggle();
    },

    on_applet_removed_from_panel: function () {
        this._killPeriodicTimer(); // Stop the ticking timer
        this.settings.finalize(); // We want to remove any connections and file listeners here
    },

    on_open_github_home_pressed: function () {
        this._openUrl("http://github.com/jamesmorgan/github-explorer");
    },

    on_open_cinnamon_home_pressed: function () {
        this._openUrl("http://cinnamon-spices.linuxmint.com/applets/view/105");
    },

    on_open_developer_home_pressed: function () {
        this._openUrl("http://www.morgan-design.com/");
    },

    on_settings_changed: function () {
        var newUserName = this.settings.getValue("username");

        var refreshStillEnabled = this.settings.getValue("enable-auto-refresh");

        var userNameChanged = this.gh.username != newUserName;

        // Get the latest option
        var showIssuesIconOnRepo = this.settings.getValue("show-issues-icon-on-repo-name");

        // Has option changed
        var hasShowIssuesConfigChanged = Config.show_issues_icon_on_repo_name != showIssuesIconOnRepo;

        // Reset back on config object
        Config.show_issues_icon_on_repo_name = showIssuesIconOnRepo;

        this.gh.username = newUserName;

        this.logger.verboseLogging = this.settings.getValue("enable-verbose-logging");

        // If rehresh disabled then kill timer
        if (!refreshStillEnabled) {
            this._killPeriodicTimer();
        }
        // If not ticking and enabled, start it
        else if (this._reloadGitHubFeedTimerId == null && refreshStillEnabled) {
            this._startGitHubLookupTimer();
        }
        // If username changed perform new lookup
        else if (userNameChanged) {
            this._setUpUsers();
            this._triggerGitHubLookup();
        }
        // Refresh github if to show issues
        else if (hasShowIssuesConfigChanged) {
            this._triggerGitHubLookup();
        }

        this.logger.debug("App : Usernames loaded = " + newUserName);
        this.logger.debug("App : Refresh Interval = " + this.settings.getValue("enable-auto-refresh"));
        this.logger.debug("App : Auto Refresh = " + this.settings.getValue("refresh-interval"));
        this.logger.debug("App : Show Issues = " + Config.show_issues_icon_on_repo_name);
        this.logger.debug("App : Verbose Logging = " + this.settings.getValue("enable-verbose-logging"));
        this.logger.debug("App : GitHub Notifications = " + this.settings.getValue("enable-github-change-notifications"));
    },

    _setUpUsers: function() {
        var self = this;
        this.users = [];
        var usernames = this.settings.getValue("username");
        var splitUsers = usernames.indexOf(',') == -1 ? [usernames] : usernames.split(',');
        for (var index in splitUsers) {
            this.logger.debug("Found username [" + splitUsers[index] + "] index [" + index + "]")

            this.users.push({
                username: splitUsers[index]
            });

            this.users[index].gh = new GitHub.GitHub({
                username: splitUsers[index],
                userIndex: index,
                version: self.metadata.version,
                logger: self.logger
            });

            // Handle failures
            this.users[index].gh.onFailure(function (userIndex, username, status_code, error_message) {
                self._handleGitHubErrorResponse(userIndex, username, status_code, error_message);
            });

            // Handle success
            this.users[index].gh.onSuccess(function (userIndex, username, jsonData) {
                self._handleGitHubSuccessResponse(userIndex, username, jsonData);
            });

            // Handle repo change events
            this.users[index].gh.onRepositoryChangedEvent(function (changeEvent) {
                self._handleRepositoryChangedEvent(changeEvent);
            });
        }
    },

    _openSettingsConfiguration: function () {
        Util.spawnCommandLine("cinnamon-settings applets " + this.metadata.uuid);
    },

    _handleGitHubErrorResponse: function (userIndex, username, status_code, error_message) {
        this.logger.error("Error Response, status code: " + status_code + " message: " + error_message);

        let notificationMessage = {};

        if (status_code === 403 && this.users[userIndex].gh.hasExceededApiLimit()) {
            notificationMessage = {title: "GitHub Explorer", content: error_message};
            this.set_applet_tooltip(_("API Rate Exceeded will try again once we are allowed"));
        }
        else {
            notificationMessage = NotificationMessages['ErrorOnLoad'];
            this.set_applet_tooltip(_("Check applet Configuration"))
        }
        this._displayErrorNotification(userIndex, notificationMessage);
        this._shouldDisplayLookupNotification = true;
    },

    _handleGitHubSuccessResponse: function (userIndex, username, jsonData) {
        if (this._shouldDisplayLookupNotification) {

            var notifyContent = NotificationMessages['SuccessfullyLoaded'];
            notifyContent.username = username;
            this._displayNotification(notifyContent);

            this._shouldDisplayLookupNotification = false;
        }
        this.set_applet_tooltip(_("Click here to open GitHub\l\n" + this.users[userIndex].gh.lastAttemptDateTime));
        this._createApplicationMenu(userIndex, username, jsonData);
    },

    _handleRepositoryChangedEvent: function (event) {
        this.logger.debug("Change Event. type [" + event.type + "] content [" + event.content + "]");
        if (this.settings.getValue("enable-github-change-notifications")) {
            this._displayNotification({
                title: event.type + " - " + event.content,
                content: event.link_url,
                username: event.username,
                userIndex: event.userIndex
            });
        }
    },

    _displayNotification: function (notifyContent) {
        let msg = notifyContent.content;
        switch (notifyContent.append) {
            case "USER_NAME":
                msg += notifyContent.username;
        }
        let notification = "notify-send \"" + notifyContent.title + "\" \"" + msg + "\" -i " + APPLET_ICON + " -a GIT_HUB_EXPLORER -t 10 -u low";
        this.logger.debug("notification call = [" + notification + "]");
        Util.spawnCommandLine(notification);
    },

    _displayErrorNotification: function (userIndex, notificationMessage) {
        this.menu.removeAll();
        this._addDefaultMenuItems(userIndex);
        this._displayNotification(notificationMessage);
    },

    _createApplicationMenu: function (userIndex, username, repos) {
        this.logger.debug("Rebuilding Menu - attempt @ = " + this.users[userIndex].gh.lastAttemptDateTime);

//        this.menu.destroy();
//        this.menu.removeAll();

        this._addDefaultMenuItems(userIndex);

        for (var i in repos) {
            let name = repos[i].name;
            let open_issues_count = repos[i].open_issues_count;

            // Show open issues if they have any
            let repoNameHeader = Config.show_issues_icon_on_repo_name && (open_issues_count != '0')
                ? _(name + " (" + open_issues_count + ")")
                : _(name);

            // Main Menu Item
            let gitHubRepoMenuItem = new PopupMenu.PopupSubMenuMenuItem(repoNameHeader);
            gitHubRepoMenuItem.actor.reactive = true;
            gitHubRepoMenuItem.actor.can_focus = true;

            // Open Repo Item
            let html_url = repos[i].html_url;
            let openRepoItem = this._createPopupImageMenuItem(L1Indent + "Open Repo In Browser", "web-browser-symbolic", function () {
                this._openUrl(html_url);
            });
            openRepoItem.actor._parent_container = this._maincontainer;
            openRepoItem.actor.reactive = true;
            openRepoItem.actor.can_focus = true;

            gitHubRepoMenuItem.menu.addMenuItem(openRepoItem);

            // Project Home Item
            let homepage = repos[i].homepage;
            if (homepage !== undefined && homepage !== "") {
                let projectHomePageItem = this._createPopupImageMenuItem(L1Indent + "Project Home", "user-home-symbolic", function () {
                    this._openUrl(homepage);
                });
                projectHomePageItem.actor._parent_container = this._maincontainer;
                projectHomePageItem.actor.reactive = true;
                projectHomePageItem.actor.can_focus = true;

                gitHubRepoMenuItem.menu.addMenuItem(projectHomePageItem);
            }

            // Details
            let gitHubRepoDetailsItem = new PopupMenu.PopupSubMenuMenuItem(_(L1Indent + "Details"), "dialog-information-symbolic");
            gitHubRepoDetailsItem.actor.reactive = true;
            gitHubRepoDetailsItem.actor.can_focus = true;

            // Details : Watchers
            let openWatchers = this._createPopupImageMenuItem(_(L2Indent + "Watchers: " + repos[i].watchers_count), "avatar-default-symbolic", function () {
                this._openUrl("https://github.com/" + this.users[userIndex].gh.username + "/" + name + "/watchers");
            }, { reactive: true });
            openWatchers.actor._parent_container = this._maincontainer;
            openWatchers.actor.reactive = true;
            openWatchers.actor.can_focus = true;

            gitHubRepoDetailsItem.menu.addMenuItem(openWatchers);

            // Details : Open Issues
            let issuesIcon = open_issues_count == '0' ? "dialog-information" : "dialog-warning-symbolic";
            let openIssuesCountItem = this._createPopupImageMenuItem(_(L2Indent + 'Open Issues: ' + open_issues_count), issuesIcon, function () {
                this._openUrl("https://github.com/" + this.users[userIndex].gh.username + "/" + name + "/issues");
            }, { reactive: true });
            openIssuesCountItem.actor._parent_container = this._maincontainer;
            openIssuesCountItem.actor.reactive = true;
            openIssuesCountItem.actor.can_focus = true;

            gitHubRepoDetailsItem.menu.addMenuItem(openIssuesCountItem);

            // Details : Forks
            let forks = repos[i].forks;
            let forksItem = this._createPopupImageMenuItem(_(L2Indent + 'Forks: ' + forks), "preferences-system-network-proxy-symbolic", function () {
                this._openUrl("https://github.com/" + this.users[userIndex].gh.username + "/" + name + "/network");
            }, { reactive: true });
            forksItem.actor._parent_container = this._maincontainer;
            forksItem.actor.reactive = true;
            forksItem.actor.can_focus = true;

            gitHubRepoDetailsItem.menu.addMenuItem(forksItem);

            // Details : Wiki
            if (repos[i].has_wiki === true) {
                let wikiItem = this._createPopupImageMenuItem(_(L2Indent + 'Wiki'), "view-dual-symbolic", function () {
                    this._openUrl("https://github.com/" + this.users[userIndex].gh.username + "/" + name + "/wiki");
                }, { reactive: true });
                wikiItem.actor._parent_container = this._maincontainer;
                wikiItem.actor.reactive = true;
                wikiItem.actor.can_focus = true;

                gitHubRepoDetailsItem.menu.addMenuItem(wikiItem);
            }

            // Add Details
            gitHubRepoMenuItem.menu.addMenuItem(gitHubRepoDetailsItem);

            this._maincontainer.add(gitHubRepoMenuItem.actor);
            this._maincontainer.realize();

//            gitHubRepoMenuItem.actor._parent_container = this._maincontainer;

//            this.menu.addMenuItem(gitHubRepoMenuItem);
        }
    },

    _createPopupImageMenuItem: function (title, icon, bindFunction, options) {
        let options = options || {};
        let openRepoItem = new PopupMenu.PopupImageMenuItem(title, icon, options);
        openRepoItem.connect("activate", Lang.bind(this, bindFunction), { reactive: true });
        return openRepoItem;
    },

    _openUrl: function (url) {
        Util.spawnCommandLine("xdg-open " + url);
    },

    _addDefaultMenuItems: function (userIndex) {
        this._addOpenGitHubMenuItem(userIndex);
        this._addOpenGistMenuItem();
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    },

    _addOpenGitHubMenuItem: function (userIndex) {
        var githubHomeMenu = this._createPopupImageMenuItem(_('Open GitHub Home'), "", function () {
            this._openUrl("https://github.com/" + this.users[userIndex].gh.username);
        }, { reactive: true });
        githubHomeMenu.actor.reactive = true;
        githubHomeMenu.actor.can_focus = true;
        this.menu.addMenuItem(githubHomeMenu);
    },

    _addOpenGistMenuItem: function () {
        var gistMenu = this._createPopupImageMenuItem(_('Create A Gist'), "", function () {
            this._openUrl("https://gist.github.com/");
        }, { reactive: true });
        gistMenu.actor.reactive = true;
        gistMenu.actor.can_focus = true;
        this.menu.addMenuItem(gistMenu);
    },

    _killPeriodicTimer: function () {
        if (this._reloadGitHubFeedTimerId) {
            Mainloop.source_remove(this._reloadGitHubFeedTimerId);
            this._reloadGitHubFeedTimerId = null;
        }
    },

    _triggerGitHubLookup: function () {
        if (this._shouldDisplayLookupNotification) {
            this._displayNotification(NotificationMessages['AttemptingToLoad']);
        }
        for (var index in this.users) {
            this.users[index].gh.loadDataFeed();
        }
        //this.gh.loadDataFeed();
    },

    /**
     * This method should only be triggered once and then keep its self alive
     **/
    _startGitHubLookupTimer: function () {
        this._killPeriodicTimer();

        this._triggerGitHubLookup();

        //TODO hack to only getting timeout from first users!
        let timeout_in_minutes = this.users[0].gh.hasExceededApiLimit()
            ? this.users[0].gh.minutesUntilNextRefreshWindow()
            : this.settings.getValue("refresh-interval");

        this.logger.debug("Time in minutes until next API request [" + timeout_in_minutes + "]");

        let timeout_in_seconds = timeout_in_minutes * 60 * 1000;

        if (timeout_in_seconds > 0 && this.settings.getValue("enable-auto-refresh")) {
            this._reloadGitHubFeedTimerId = Mainloop.timeout_add(timeout_in_seconds, Lang.bind(this, this._startGitHubLookupTimer));
        }
    }
};
