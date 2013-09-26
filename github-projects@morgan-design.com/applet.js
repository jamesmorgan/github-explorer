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
	
    this.reloadGitHubFeedTimerId = 0;
		    	
	Applet.IconApplet.prototype._init.call(this, orientation);

		try {
			this.set_applet_icon_path(APPLET_ICON)
			this.set_applet_tooltip(_("Click here to open GitHub"));

			this.path = metadata.path;
			this.settingsFile = this.path+"/settings.json";
			this.loadSettings();

			//Setup logger
			this.logger = new Logger.Logger({ 'UUID':UUID });
			
			this.logger.debug("App : Username loaded = " + this.settings.username);
			this.logger.debug("App : Version loaded = " + this.settings.version);
			this.logger.debug("App : RefreshInterval loaded = " + this.settings.refreshInterval);
			
			// Menu setup
			this.menu = new Applet.AppletPopupMenu(this, orientation);
			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menuManager.addMenu(this.menu);
			
			let _this = this;
			this.gh=new GitHub.GitHub({
				'username':this.settings.username,
				'version':this.settings.version, 	
				'callbacks':{
					'onError':function(status_code, error_message){
						_this.onGitHubError(status_code, error_message)
					},
					'onNewFeed':function(jsonData){
						_this.onGitHubNewFeed(jsonData);
					}
				}
			}, this.logger);

			// Add menu items
			this.addOpenGitHubMenuItem();
			
			// Add Settings menu item
			let menuitem = new PopupMenu.PopupImageMenuItem("Settings", "preferences-system-symbolic");
			menuitem.connect('activate', Lang.bind(this, this.openSettings));
			this._applet_context_menu.addMenuItem(menuitem);

			if(!this.gh.initialised()){
				this.onSetupError(NotificationMessages['ErrorOnLoad']);
			}

			if(this.settings.username == "" || this.settings.username == "username"){
				this.showNotify(NotificationMessages['NoUsernameSet']);
				this.openSettings();
			} else {
				this.showNotify(NotificationMessages['AttemptingToLoad']);
				this.startTickingLookupAction();
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
	
	openSettings: function() {
		try{
			this.logger.debug("openSettings ");
			[success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(this.path, ["/usr/bin/gjs","settings.js",this.settingsFile], null, GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
			GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, this.onSettingsWindowClosed));
		}
		catch (e) {
			this.logger.error(e);
		}
	},

	onSettingsWindowClosed: function(pid, status, requestObj) {
		this.logger.debug("onSettingsWindowClosed");
		this.loadSettings();

		this.gh.username = this.settings.username;
		this.showNotify(NotificationMessages['AttemptingToLoad']);
		
		// Set refresh timer going if not set
		this.onLoadGitHubTimer();
	},
	
	loadSettings: function() {
		this.settings = JSON.parse(Cinnamon.get_file_contents_utf8_sync(this.settingsFile));
		this.onToggleAutoUpdate();
	},

	onToggleAutoUpdate: function() {
		if(!this.settings.enableAutoUpdate && this.reloadGitHubFeedTimerId){
			this.logger.debug("Disabling auto refresh of GitHub");
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
		}
	},
	
    on_applet_clicked: function(event){
        this.menu.toggle();
    },

	on_applet_removed_from_panel: function() {
		if (this.reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
		}
	},
    
    onGitHubError: function(status_code, error_message){
		this.logger.debug("OnGitHubError -> status code: " + status_code + " message: " + error_message);
		let notificationMessage = (status_code == 403 && error_message != undefined)
										? {title:"GitHub Explorer",content:error_message} 
										: NotificationMessages['ErrorOnLoad']
		this.onSetupError(notificationMessage);
    },
    
    onGitHubNewFeed: function(jsonData) {
		this.showNotify(NotificationMessages['SuccessfullyLoaded']);
    	this.rebuildMenu(jsonData);
		this.onLoadGitHubTimer();
    },

	showNotify: function(notifyContent){
		let title = notifyContent.title;
		let msg = notifyContent.content;
		if(notifyContent.append != undefined){ 
			switch(notifyContent.append){
				case "USER_NAME":
					msg += this.gh.username;
			}
		}
		let notification = "notify-send \""+title+"\" \""+msg+"\" -i " + APPLET_ICON + " -a GIT_HUB_EXPLORER -t 10 -u low";
		this.logger.debug("notification call = [" + notification + "]")
		Util.spawnCommandLine(notification);
	},

	buildPopupMenuItem: function(title, icon, bindFunction, options){
		var options = options || {};			
		this.logger.debug("buildPopupMenuItem = [" + title + "]")
		let openRepoItem = new PopupMenu.PopupImageMenuItem(title, icon, options);
		openRepoItem.connect("activate", Lang.bind(this, bindFunction));
		return openRepoItem;
	},

	rebuildMenu: function(repos) {
		this.logger.debug("Rebuilding Menu");
		this.menu.removeAll();
		this.addOpenGitHubMenuItem();
		
		for (i in repos) {
			let name = repos[i].name;
			
			// Main Menu Item
			let gitHubRepoMenuItem = new PopupMenu.PopupSubMenuMenuItem(_(name));

			// Open Repo Item
			let openRepoItem = this.buildPopupMenuItem("Open Repo In Browser", "web-browser-symbolic", function() { 
					this.openUrl(repos[i].html_url); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(openRepoItem);
			
			// Project Home Item
			let projectHomePageItem = this.buildPopupMenuItem("Project Home", "user-home-symbolic", function() { 
					this.openUrl(repos[i].homepage); 
			});
			gitHubRepoMenuItem.menu.addMenuItem(projectHomePageItem);
			
			// Details
			let gitHubRepoDetailsItem = new PopupMenu.PopupSubMenuMenuItem(_("Details"), "dialog-information-symbolic");	
			
			// Details : Watchers
			gitHubRepoDetailsItem.menu.addMenuItem(new PopupMenu.PopupMenuItem(_('Watchers: ' + repos[i].watchers_count), { reactive: false }));

			// Details : Open Issues
			let open_issues_count = repos[i].open_issues_count;
			let issuesIcon = open_issues_count == '0' ? "dialog-information" : "dialog-warning-symbolic";
			let openIssuesCountItem = this.buildPopupMenuItem(_('Open Issues: ' + open_issues_count), issuesIcon, function() { 
					this.openUrl("https://github.com/"+this.gh.username+"/"+name+"/issues"); 
			}, { reactive: true });
			gitHubRepoDetailsItem.menu.addMenuItem(openIssuesCountItem);

			// Details : Forks		
			let forksItem = this.buildPopupMenuItem(_('Forks: ' + repos[i].forks), "preferences-system-network-proxy-symbolic", function() { 
					this.openUrl("https://github.com/"+this.gh.username+"/"+name+"/network"); 
			}, { reactive: true });
			gitHubRepoDetailsItem.menu.addMenuItem(forksItem);
	
			// Add Details
			gitHubRepoMenuItem.menu.addMenuItem(gitHubRepoDetailsItem);
	
		    this.menu.addMenuItem(gitHubRepoMenuItem);
		    this.menu.addMenuItem(projectHomePageItem);
		}
	},
	
	openUrl: function(url) {
    	Util.spawnCommandLine("xdg-open " + url);
	},

	addOpenGitHubMenuItem: function() {
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Open GitHub Home'), { reactive: true });
		this.numMenuItem.connect("activate", Lang.bind(this, function() { 
				this.openUrl("https://github.com/"+this.gh.username); 
		}));
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	},
	
	onSetupError: function(notificationMessage) {
		this.set_applet_tooltip(_("Unable to find user -> Right Click 'Settings'"));
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Error, Right Click Settings!'), { reactive: false });
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.showNotify(notificationMessage);
	},
	
	startTickingLookupAction: function() {
		this.gh.loadDataFeed();
		
		if(this.settings.enableAutoUpdate){
	    	this.onUpdateLoadGitHubTimer(this.settings.refreshInterval * 60 * 1000);
		}
	},
	
	onLoadGitHubTimer: function() {
		if(this.settings.enableAutoUpdate){
	    	this.onUpdateLoadGitHubTimer(this.settings.refreshInterval * 60 * 1000);
		} else {
			this.gh.loadDataFeed();
		}
	},
	
	onUpdateLoadGitHubTimer: function(timeout) {
		if (this.reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
			this.reloadGitHubFeedTimerId = 0;
		}
		if (timeout > 0 && this.settings.enableAutoUpdate) {
			this.reloadGitHubFeedTimerId = Mainloop.timeout_add(timeout, Lang.bind(this, function(){
				this.gh.loadDataFeed();
				this.onLoadGitHubTimer();
			}));
		}
	},
};
