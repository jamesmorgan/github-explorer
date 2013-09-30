/** Allows import of other files e.g. const GitHub=imports.github; = github.js */
imports.searchPath.push( imports.ui.appletManager.appletMeta["github-projects@morgan-design.com"].path );

/** Imports START **/
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;
const Cinnamon = imports.gi.Cinnamon;

const Applet = imports.ui.applet;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

const Tooltips = imports.ui.tooltips;

const Settings = imports.ui.settings;  // Needed for settings API
/** Imports END **/

/** Custom Files START **/
const GitHub=imports.github;
const Logger=imports.logger;
/** Custom Files END **/

const UUID = 'github-projects';
const APPLET_ICON = global.userdatadir + "/applets/github-projects@morgan-design.com/icon.png";

const NotificationMessages = {
    AttemptingToLoad: 	{ title: "GitHub Explorer", 					content: "Attempting to Load your GitHub Repos" },
    SuccessfullyLoaded: { title: "GitHub Explorer", 					content: "Successfully Loaded GitHub Repos for user ", append: "USER_NAME" },
    ErrorOnLoad: 		{ title: "ERROR:: GitHub Explorer ::ERROR", 	content: "Failed to load GitHub Repositories! Check applet Configuration" },
    NoUsernameSet:		{ title: "ERROR:: Not setup properly ::ERROR",	content: "Please set your user! Check applet Configuration'" }
};

/* Application Hook */
function main(metadata, orientation) {
	let myApplet = new MyApplet(metadata, orientation);
	return myApplet;
}

/* Constructor */
function MyApplet(metadata, orientation) {
	this._init(metadata, orientation);
}

MyApplet.prototype = {
	__proto__: Applet.IconApplet.prototype,

	_init: function(metadata, orientation, instance_id) {

	this.settings = new Settings.AppletSettings(this, "github-projects@morgan-design.com", instance_id);	
	
	this._reloadGitHubFeedTimerId = 0;
	this._shouldDisplayLookupNotification = true;
    	
	Applet.IconApplet.prototype._init.call(this, orientation, instance_id);
		try {
			this.set_applet_icon_path(APPLET_ICON);

			this.settings.bindProperty(Settings.BindingDirection.IN,   // The binding direction - IN means we only listen for changes from this applet
							 "username",                               // The setting key, from the setting schema file
							 "username",                               // The property to bind the setting to - in this case it will initialize this.icon_name to the setting value
							 this.on_settings_changed,                  // The method to call when this.icon_name has changed, so you can update your applet
							 null);                                     // Any extra information you want to pass to the callback (optional - pass null or just leave out this last argument)

			this.settings.bindProperty(Settings.BindingDirection.IN,   
							 "enable-auto-refresh",                              
							 "enable_auto_refresh",                               
							 this.on_settings_changed,                 
							 null);

			this.settings.bindProperty(Settings.BindingDirection.IN,   
							 "refresh-interval",                              
							 "refresh_interval",                               
							 this.on_settings_changed,                 
							 null);

			// Set version from metadata
			this.settings.setValue("applet-version", metadata.version);

			this.logger = new Logger.Logger({ 'UUID':UUID });
			
			// Menu setup
			this.menu = new Applet.AppletPopupMenu(this, orientation);
			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menuManager.addMenu(this.menu);
			
			let self = this;
			this.gh=new GitHub.GitHub({
				'username':this.settings.getValue("username"),
				'version':metadata.version, 	
				'callbacks':{
					'onError':function(status_code, error_message){
						self._handleGitHubErrorResponse(status_code, error_message)
					},
					'onNewFeed':function(jsonData){
						self._handleGitHubSuccessResponse(jsonData);
					}
				}
			}, this.logger);


			// Add Settings menu item
			let settingsMenu = new PopupMenu.PopupImageMenuItem("Settings", "preferences-system-symbolic");
			settingsMenu.connect('activate', Lang.bind(this, function(){
				this._openSettingsConfiguration(metadata.uuid);
			}));
			this._applet_context_menu.addMenuItem(settingsMenu);

			// If no username set, launch configuration options and tell the user
			if(this.settings.getValue("username") == "" || this.settings.getValue("username") == undefined){
				this._openSettingsConfiguration(metadata.uuid);
				this._displayErrorNotification(NotificationMessages['ErrorOnLoad']);
			} else {
				// Make first github lookup and trigger ticking timer!
				this._initiateTimedLookedAction();
			}
		}
		catch (e) {
			if(this.logger!=undefined){
				this.logger.error(e);			
				global.logError(e);
			}else{
				global.logError(e);
			}
		}
	},
	
		
    on_applet_clicked: function(event){
		this.menu.toggle();
    },

	on_applet_removed_from_panel: function() {
		this._killPeriodicTimer();
		this.settings.finalize();    // This is called when a user removes the applet from the panel.. we want to
									 // Remove any connections and file listeners here, which our settings object
									 // has a few of
	},

	on_open_github_home_pressed: function(){ this._openUrl("http://github.com/jamesemorgan/CustomCinnamonApplets"); },
	
	on_open_cinnamon_home_pressed: function(){ this._openUrl("http://cinnamon-spices.linuxmint.com/applets/view/105"); },
	
	on_open_developer_home_pressed: function(){	this._openUrl("http://morgan-design.com"); },
		
	on_settings_changed: function() {
		var newUserName = this.settings.getValue("username");
		
		var refreshStillEnabled = this.settings.getValue("enable-auto-refresh");
		
		var userNameChanged = this.gh.username != newUserName;
		
		if(userNameChanged){ 
			this.gh.username = newUserName;
		}
		
		if(refreshStillEnabled && userNameChanged){
			this._initiateTimedLookedAction(); // If timer not running and user changed trigger fresh lookup
		} 
		else if(!refreshStillEnabled){
			this._killPeriodicTimer(); // If timer diabled remove it
		}
		else if(refreshStillEnabled) {
			this._startGitHubLookupTimer(); // If timer still enabled ensure it is still kicking
		}
				
		this.logger.debug("App : Username loaded = " + newUserName);
		this.logger.debug("App : Refresh Interval = " + this.settings.getValue("enable-auto-refresh"));
		this.logger.debug("App : Auto Refresh = " + this.settings.getValue("refresh-interval"));
	},
	
	_openSettingsConfiguration: function(uuid){
		Util.spawnCommandLine("cinnamon-settings applets " + uuid);
	},

    _handleGitHubErrorResponse: function(status_code, error_message){
		this.logger.debug("_handleGitHubErrorResponse -> status code: " + status_code + " message: " + error_message);
		let notificationMessage = (status_code == 403 && error_message != undefined)
										? {title:"GitHub Explorer",content:error_message} 
										: NotificationMessages['ErrorOnLoad']
		this._displayErrorNotification(notificationMessage);
		this._shouldDisplayLookupNotification = true;
    },
    
    _handleGitHubSuccessResponse: function(jsonData) {
		if(this._shouldDisplayLookupNotification){
			this._displayNotification(NotificationMessages['SuccessfullyLoaded']);
			this._shouldDisplayLookupNotification = false;
    	}
		this._createApplicationMenu(jsonData);
		this._startGitHubLookupTimer();
    },

	_displayNotification: function(notifyContent){
		let msg = notifyContent.content;
		if(notifyContent.append != undefined){ 
			switch(notifyContent.append){
				case "USER_NAME":
					msg += this.gh.username;
			}
		}
		let notification = "notify-send \""+notifyContent.title+"\" \""+msg+"\" -i " + APPLET_ICON + " -a GIT_HUB_EXPLORER -t 10 -u low";
		this.logger.debug("notification call = [" + notification + "]")
		Util.spawnCommandLine(notification);
	},
	
	_displayErrorNotification: function(notificationMessage) {
		this.menu.removeAll();

		this._addOpenGitHubMenuItem();

		this.set_applet_tooltip(_("Unable to find user -> Check applet Configuration"));
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Error, Check applet Configuration'), { reactive: false });
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this._displayNotification(notificationMessage);
	},

	_createApplicationMenu: function(repos) {
		this.logger.debug("Rebuilding Menu");
		this.menu.removeAll();
		
		this._addOpenGitHubMenuItem();
	
		for (i in repos) {
			let name = repos[i].name;
			
			// Main Menu Item
			let gitHubRepoMenuItem = new PopupMenu.PopupSubMenuMenuItem(_(name));

			// Open Repo Item
			let html_url = repos[i].html_url;
			let openRepoItem = this._createPopupImageMenuItem("Open Repo In Browser", "web-browser-symbolic", function() { 
					this._openUrl(html_url); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(openRepoItem);
			
			// Project Home Item
			let homepage = repos[i].homepage;
			let projectHomePageItem = this._createPopupImageMenuItem("Project Home", "user-home-symbolic", function() { 
					this._openUrl(homepage); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(projectHomePageItem);
			
			// Details : Watchers
			let gitHubRepoDetailsItem = new PopupMenu.PopupSubMenuMenuItem(_("Details"), "dialog-information-symbolic");	
			gitHubRepoDetailsItem.menu.addMenuItem(new PopupMenu.PopupMenuItem(_('Watchers: ' + repos[i].watchers_count), { reactive: false }));

			// Details : Open Issues
			let open_issues_count = repos[i].open_issues_count;
			let issuesIcon = open_issues_count == '0' ? "dialog-information" : "dialog-warning-symbolic";
			let openIssuesCountItem = this._createPopupImageMenuItem(_('Open Issues: ' + open_issues_count), issuesIcon, function() { 
					this._openUrl("https://github.com/"+this.gh.username+"/"+name+"/issues"); 
			}, { reactive: true });
			gitHubRepoDetailsItem.menu.addMenuItem(openIssuesCountItem);

			// Details : Forks
			let forks = repos[i].forks;		
			let forksItem = this._createPopupImageMenuItem(_('Forks: ' + forks), "preferences-system-network-proxy-symbolic", function() { 
					this._openUrl("https://github.com/"+this.gh.username+"/"+name+"/network"); 
			}, { reactive: true });
			gitHubRepoDetailsItem.menu.addMenuItem(forksItem);
	
			// Add Details
			gitHubRepoMenuItem.menu.addMenuItem(gitHubRepoDetailsItem);
	
		    this.menu.addMenuItem(gitHubRepoMenuItem);
		    this.menu.addMenuItem(projectHomePageItem);
		}
	},
	
	_createPopupImageMenuItem: function(title, icon, bindFunction, options){
		let options = options || {};
		let openRepoItem = new PopupMenu.PopupImageMenuItem(title, icon, options);
		openRepoItem.connect("activate", Lang.bind(this, bindFunction));
		return openRepoItem;
	},
	
	_openUrl: function(url) {
    	Util.spawnCommandLine("xdg-open " + url);
	},
	
	_addDefaultMenuItems: function() {
		this._addOpenGitHubMenuItem();
	},
	
	_addOpenGitHubMenuItem: function(){
		this.numMenuItem = this._createPopupImageMenuItem(_('Open GitHub Home'), "", function() { 
				this._openUrl("https://github.com/"+this.gh.username); 
		}, { reactive: true });
		
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());	
	},

	_initiateTimedLookedAction: function() {
		this._triggerGitHubLookup();
		this._startGitHubLookupTimer();
	},
	
	_killPeriodicTimer: function(){
		if (this._reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this._reloadGitHubFeedTimerId);
		}		
	},
	
	_triggerGitHubLookup: function() {
		if(this._shouldDisplayLookupNotification){
			this._displayNotification(NotificationMessages['AttemptingToLoad']);
		}
		this.set_applet_tooltip(_("Click here to open GitHub"));
		this.gh.loadDataFeed();
	},
	
	_startGitHubLookupTimer: function() {
		this._killPeriodicTimer();
				
		var timeout = this.settings.getValue("refresh-interval") * 60 * 1000;
		if (timeout > 0 && this.settings.getValue("enable-auto-refresh")) {
			this._reloadGitHubFeedTimerId = 
				Mainloop.timeout_add(timeout, Lang.bind(this, this._initiateTimedLookedAction));
		}
	},
};
