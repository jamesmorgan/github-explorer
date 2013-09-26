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
    ErrorOnLoad: 		{ title: "ERROR:: GitHub Explorer ::ERROR", 	content: "Failed to load GitHub Repositories! Check your settings -> Right Click 'Settings'" },
    NoUsernameSet:		{ title: "ERROR:: Not setup properly ::ERROR",	content: "Please set your user! Check your settings -> Right Click 'Settings'" }
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
	
	_init: function(metadata, orientation) {
	
	this.path = metadata.path;
	this.settingsFile = this.path+"/settings.json";
	
	this._reloadGitHubFeedTimerId = 0;
	this._shouldDisplayLookupNotification = true;
    	
	Applet.IconApplet.prototype._init.call(this, orientation);
		try {
			this.set_applet_icon_path(APPLET_ICON)
			this.set_applet_tooltip(_("Click here to open GitHub"));

			this._reloadSettings();

			this.logger = new Logger.Logger({ 'UUID':UUID });
			this.logger.debug("App : Username loaded = " + this.settings.username);
			this.logger.debug("App : Version loaded = " + this.settings.version);
			this.logger.debug("App : RefreshInterval loaded = " + this.settings.refreshInterval);
			
			// Menu setup
			this.menu = new Applet.AppletPopupMenu(this, orientation);
			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menuManager.addMenu(this.menu);
			
			let self = this;
			this.gh=new GitHub.GitHub({
				'username':this.settings.username,
				'version':this.settings.version, 	
				'callbacks':{
					'onError':function(status_code, error_message){
						self._handleGitHubErrorResponse(status_code, error_message)
					},
					'onNewFeed':function(jsonData){
						self._handleGitHubSuccessResponse(jsonData);
					}
				}
			}, this.logger);

			// Add default none GitHub settings menu
			this._addDefaultMenuItems();

			if(!this.gh.initialised()){
				this._displayErrorNotification(NotificationMessages['ErrorOnLoad']);
			}

			if(this.settings.username == "" || this.settings.username == "username"){
				this._displayNotification(NotificationMessages['NoUsernameSet']);
				this._openSettingsWindow();
			} else {
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
		if (this._reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this._reloadGitHubFeedTimerId);
		}
	},
	
	_openSettingsWindow: function() {
		try{
			this.logger.debug("_openSettingsWindow ");
			[success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(this.path, ["/usr/bin/gjs","settings.js",this.settingsFile], null, GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
			GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, this._onSettingsWindowClosed));
		}
		catch (e) {
			this.logger.error(e);
		}
	},

	_onSettingsWindowClosed: function(pid,  status, requestObj) {
		//TODO only trigger reload if username changed?
		this.logger.debug("_onSettingsWindowClosed status : " + status);
		this.logger.debug("_onSettingsWindowClosed pid : " + pid);
		this.logger.debug("_onSettingsWindowClosed requestObj : " + requestObj);

		this._reloadSettings();

		// TODO set _shouldDisplayLookupNotification if settings have changed

		this._initiateTimedLookedAction();
	},
	
	_reloadSettings: function() {
		this.settings = JSON.parse(Cinnamon.get_file_contents_utf8_sync(this.settingsFile));
		if(this.gh != undefined){
			this.gh.username = this.settings.username
		}
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

		this.set_applet_tooltip(_("Unable to find user -> Right Click 'Settings'"));
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Error, Right Click Settings!'), { reactive: false });
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
			let openRepoItem = this._createPopupImageMenuItem("Open Repo In Browser", "web-browser-symbolic", function() { 
					this._openUrl(repos[i].html_url); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(openRepoItem);
			
			// Project Home Item
			let projectHomePageItem = this._createPopupImageMenuItem("Project Home", "user-home-symbolic", function() { 
					this._openUrl(repos[i].homepage); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(projectHomePageItem);
			
			// Details
			let gitHubRepoDetailsItem = new PopupMenu.PopupSubMenuMenuItem(_("Details"), "dialog-information-symbolic");	
			
			// Details : Watchers
			gitHubRepoDetailsItem.menu.addMenuItem(new PopupMenu.PopupMenuItem(_('Watchers: ' + repos[i].watchers_count), { reactive: false }));

			// Details : Open Issues
			let open_issues_count = repos[i].open_issues_count;
			let issuesIcon = open_issues_count == '0' ? "dialog-information" : "dialog-warning-symbolic";
			let openIssuesCountItem = this._createPopupImageMenuItem(_('Open Issues: ' + open_issues_count), issuesIcon, function() { 
					this._openUrl("https://github.com/"+this.gh.username+"/"+name+"/issues"); 
			}, { reactive: true });
			gitHubRepoDetailsItem.menu.addMenuItem(openIssuesCountItem);

			// Details : Forks		
			let forksItem = this._createPopupImageMenuItem(_('Forks: ' + repos[i].forks), "preferences-system-network-proxy-symbolic", function() { 
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
		var options = options || {};
		let openRepoItem = new PopupMenu.PopupImageMenuItem(title, icon, options);
		openRepoItem.connect("activate", Lang.bind(this, bindFunction));
		return openRepoItem;
	},
	
	_openUrl: function(url) {
    	Util.spawnCommandLine("xdg-open " + url);
	},
	
	_addDefaultMenuItems: function() {
		this._addOpenGitHubMenuItem();
		
		let menuitem = this._createPopupImageMenuItem("Settings", "preferences-system-symbolic", this._openSettingsWindow)	
		this._applet_context_menu.addMenuItem(menuitem);	
	},
	
	_addOpenGitHubMenuItem: function(){
		this.numMenuItem = this._createPopupImageMenuItem(_('Open GitHub Home'), "", function() { 
				this._openUrl("https://github.com/"+this.gh.username+"/"+name+"/issues"); 
		}, { reactive: true });
		
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());	
	},

	_initiateTimedLookedAction: function() {
		this._triggerGitHubLookup();
		this._startGitHubLookupTimer();
	},
	
	_triggerGitHubLookup: function() {
		if(this._shouldDisplayLookupNotification){
			this._displayNotification(NotificationMessages['AttemptingToLoad']);
		}
		this.gh.loadDataFeed();
	},
	
	_startGitHubLookupTimer: function() {
		if (this._reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this._reloadGitHubFeedTimerId);
			this._reloadGitHubFeedTimerId = 0;
		}
		
		var timeout = this.settings.refreshInterval * 60 * 1000;
		if (timeout > 0 && this.settings.enableAutoUpdate) {
			this._reloadGitHubFeedTimerId = 
				Mainloop.timeout_add(timeout, Lang.bind(this, function(){
					this._initiateTimedLookedAction();
				}));
		}
	},
};
