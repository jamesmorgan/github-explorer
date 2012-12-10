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
/** Custom Files END **/

const UUID = 'github-projects';
const APPLET_ICON = global.userdatadir + "/applets/github-projects@morgan-design.com/icon.png";

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

	this.successfulFirstLoad = false;
			    	
	Applet.IconApplet.prototype._init.call(this, orientation);

		try {
			log("APPLET_ICON = " + APPLET_ICON);
			this.set_applet_icon_path(APPLET_ICON)
			this.set_applet_tooltip(_("Click here to open GitHub"));

			log("Loading Settings");
			
			this.path = metadata.path;
			this.settingsFile = this.path+"/settings.json";
			log("Settings File path = " + this.settingsFile);
			this.loadSettings();
			log("Username loaded = " + this.settings.username);
			log("RefreshInterval loaded = " + this.settings.refreshInterval);
			
			// Menu setup
			this.menu = new Applet.AppletPopupMenu(this, orientation);

			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menuManager.addMenu(this.menu);
			
			let _this = this;
			
			this.gh=new GitHub.GitHub({
				'username':_this.settings.username,
				'callbacks':{
					'onError':function(status_code){
						_this.onGitHubError(status_code)
					},
					'onNewFeed':function(jsonData){
						_this.onGitHubNewFeed(jsonData);
					}
				}
			});

			if(!this.gh.initialised()){
				this.onSetupError();
				return;
			}
			this.showNotify("GitHub Explorer", "Attempting to Load your GitHub Repos");
			this.addOpenGitHubMenuItem();
			this.onLoadGitHubTimer();	
			
			log("Opening Settings");
			let menuitem = new PopupMenu.PopupMenuItem("Settings");
			menuitem.connect('activate', Lang.bind(this, this.openSettings));
			log("Adding to context menu");
			this._applet_context_menu.addMenuItem(menuitem);			
			
		}
		catch (e) {
			logError(e);
		}
	},

	openSettings: function() {
		try{
			log("openSettings ");
			[success, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(this.path, ["/usr/bin/gjs","settings.js",this.settingsFile], null, GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
			GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, this.onSettingsWindowClosed));
		}
		catch (e) {
			logError(e);
		}
	},

	onSettingsWindowClosed: function(pid, status, requestObj) {
		log("onSettingsWindowClosed");
		this.loadSettings();
	},
	
	loadSettings: function() {
		log("loadSettings");
		try {
			this.settings = JSON.parse(Cinnamon.get_file_contents_utf8_sync(this.settingsFile));
		} catch(e) {
			logError("Settings file not found. Using default values.");
			this.settings = JSON.parse('{"enableAutoUpdate":true,"refreshInterval":2,"username":"username"}');
		}
		this.onToggleAutoUpdate();
	},

	onToggleAutoUpdate: function() {
		if(!this.settings.enableAutoUpdate && this.reloadGitHubFeedTimerId){
			log("Disabling auto refresh of GitHub");
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
    
    onGitHubError: function(status_code){
		log("OnGitHubError -> StatusCode: " + status_code);
		this.onSetupError();
    },
    
    onGitHubNewFeed: function(jsonData) {
		if(!this.successfulFirstLoad){
			this.successfulFirstLoad = true;
			this.showNotify("GitHub Explorer", "Succesfully Loaded GitHub Repos for user " + this.gh.username);
		}
    	this.rebuildMenu(jsonData);
    },

	showNotify: function(title,msg){
		let cleanTitle = title.replace(/"/g, "&quot;");
		let cleanMsg = msg.replace(/"/g, "&quot;");
		// Title, Message, Icon, Timeout (3 seconds)
		Util.spawnCommandLine("notify-send \""+cleanTitle+"\" \""+cleanMsg+"\" -i " + APPLET_ICON + " -t 3000");
	},

	rebuildMenu: function(repos) {
		log("Rebuilding Menu");
		this.menu.removeAll();
		this.addOpenGitHubMenuItem();
		var _this = this;
		
		for (i in repos) {
			let name = repos[i].name;
			let html_url = repos[i].html_url;
			let project_home = repos[i].homepage;
			let open_issues_count = repos[i].open_issues_count;
			let watchers_count = repos[i].watchers_count;
			let forks = repos[i].forks;
			
			// Main Menu Item
			let gitHubRepoMenuItem = new PopupMenu.PopupSubMenuMenuItem(_(name));

			// Open Repo Item
			let openRepoItem = new PopupMenu.PopupImageMenuItem("Open Repo In Browser", "web-browser-symbolic");
			openRepoItem.connect("activate", Lang.bind(this, function() { 
					_this.openUrl(html_url); 
			}));
			gitHubRepoMenuItem.menu.addMenuItem(openRepoItem);
			
			// Project Home Item
			let projectHomePageItem = new PopupMenu.PopupImageMenuItem("Project Home", "user-home-symbolic");
			projectHomePageItem.connect("activate",	Lang.bind(this, function() { 
					_this.openUrl(project_home); 
			}));
			gitHubRepoMenuItem.menu.addMenuItem(projectHomePageItem);
	
			// Details
			let gitHubRepoDetailsItem = new PopupMenu.PopupSubMenuMenuItem(_("Details"), "dialog-information-symbolic");	
			
			// Details : Watchers
			let watchersCountItem = new PopupMenu.PopupMenuItem(_('Watchers: ' + watchers_count), { reactive: false })
			gitHubRepoDetailsItem.menu.addMenuItem(watchersCountItem);

			// Details : Open Issues
			let issuesIcon = open_issues_count == '0' ? "dialog-information" : "dialog-warning-symbolic";
			let openIssuesCountItem = new PopupMenu.PopupImageMenuItem(_('Open Issues: ' + open_issues_count),issuesIcon, { reactive: true })
			openIssuesCountItem.connect("activate", Lang.bind(this, function() { 
					_this.openUrl("https://github.com/"+_this.gh.username+"/"+name+"/issues"); 
			}));
			
			gitHubRepoDetailsItem.menu.addMenuItem(openIssuesCountItem);

			// Details : Forks
			let forksItem = new PopupMenu.PopupImageMenuItem(_('Forks: ' + forks), "preferences-system-network-proxy-symbolic", { reactive: true })
			forksItem.connect("activate", Lang.bind(this, function() { 
					_this.openUrl("https://github.com/"+_this.gh.username+"/"+name+"/network")
			}));
			
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
		let _this = this;
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Open GitHub Home'), { reactive: true });
		this.numMenuItem.connect("activate", Lang.bind(this, function() { 
				_this.openUrl("https://github.com/"+_this.gh.username); 
		}));
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	},
	
	onSetupError: function() {
		this.set_applet_tooltip(_("Unable to find user, check settings.js"));
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Error, check settings.js!'), { reactive: false });
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.showNotify("ERROR :: GitHub Explorer :: ERROR", "Failed to load your Repos, check your settings.js");
	},
	
	onLoadGitHubTimer: function() {
		this.gh.loadDataFeed();
		if(this.settings.enableAutoUpdate){
	    	this.onUpdateLoadGitHubTimer(this.settings.refreshInterval * 60 * 1000);
		}
	},
	
	onUpdateLoadGitHubTimer: function(timeout) {
		if (this.reloadGitHubFeedTimerId) {
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
			this.reloadGitHubFeedTimerId = 0;
		}
		if (timeout > 0 && this.settings.enableAutoUpdate){
			this.reloadGitHubFeedTimerId = Mainloop.timeout_add(timeout,Lang.bind(this, this.onLoadGitHubTimer));
		}
	},
};

function log(message) {
	global.log(UUID + "::" + log.caller.name + ": " + message);
}

function logError(error) {
	global.logError(UUID + "::" + logError.caller.name + ": " + error);
}


