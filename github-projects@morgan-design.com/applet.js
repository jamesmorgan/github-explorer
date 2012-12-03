/** Allows import of other files e.g. const GitHub=imports.github; = github.js */
imports.searchPath.push( imports.ui.appletManager.appletMeta["github-projects@morgan-design.com"].path );

/** Imports START **/
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;

const Applet = imports.ui.applet;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

const Tooltips = imports.ui.tooltips;
/** Imports END **/

/** Custom Files START **/
const GitHub=imports.github;
const Settings=imports.settings;
/** Custom Files END **/

const UUID = 'github-projects';
const APPLET_ICON = global.userdatadir + "/applets/github-projects@morgan-design.com/icon.png";

/* Constructor */
function MyApplet(orientation) {
	this._init(orientation);
}

MyApplet.prototype = {
	__proto__: Applet.IconApplet.prototype,
	
	_init: function(orientation) {
	
    this.reloadGitHubFeedTimerId = 0;
    this.reloadGitHubFeedTimeout=Settings.reloadGitHubFeedTimeout*1000;
    	
	Applet.IconApplet.prototype._init.call(this, orientation);

		try {
			log("Username from settings.js  = " + Settings.username);
			log("ReloadGitHubFeedTimeout from settings.js  = " + Settings.reloadGitHubFeedTimeout);
			log("APPLET_ICON = " + APPLET_ICON);

			this.set_applet_icon_path(APPLET_ICON)
			this.set_applet_tooltip(_("Click here to open GitHub"));
			
			// Menu setup
			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menu = new Applet.AppletPopupMenu(this, orientation);
			this.menuManager.addMenu(this.menu);

			let this_ = this;
			
			this.gh=new GitHub.GitHub({
				'username':Settings.username,
				'callbacks':{
					'onError':function(status_code){
						this_.onGitHubError(status_code)
					},
					'onNewFeed':function(jsonData){
						log("onNewFeed found");
						this_.onGitHubNewFeed(jsonData);
					}
				}
			});

			if(!this.gh.initialised()){
				this.onSetupError();
				return;
			}
			this.addOpenGitHubMenuItem();		
			this.onLoadGitHubTimer(5000);	
		}
		catch (e) {
			logError(e);
		}
	},
	
    on_applet_clicked: function(event){
        this.menu.toggle();
    },
    
	on_applet_removed_from_panel: function() {
		if (this.reloadGitHubFeedTimerId) {
			log("on_applet_removed_from_panel");
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
		}		
	},
    
    onGitHubError: function(status_code){
		log("OnGitHubError -> StatusCode: " + status_code);
		this.onSetupError();
    },
    
    onGitHubNewFeed: function(jsonData) {
    	log("Found onGitHubNewFeed");
    	this.rebuildMenu(jsonData);
    },
    	
	rebuildMenu: function(repos) {
		log("Rebuilding Menu");
		this.menu.removeAll();
		this.addOpenGitHubMenuItem();
		var _this = this;
		
		for (i in repos) {
			
			let name = repos[i].name;
			let html_url = repos[i].html_url;
			
			log("repo name = " + name + " | repo url = " + html_url);
			var githubRepoMenuItem = new PopupMenu.PopupMenuItem(name);
			githubRepoMenuItem.connect("activate", 
				Lang.bind(this, function() { 
					_this.openUrl(html_url); 
				})
			);
			//TODO tooltips
			//var toolTippedMenuItem = new Tooltips.Tooltip(githubRepoMenuItem.label, _("Navigate to " + name));
			this.menu.addMenuItem(githubRepoMenuItem);
		}
	},

	openUrl: function(url) {
    	Util.spawnCommandLine("xdg-open " + url);
	},

	addOpenGitHubMenuItem: function() {
		log("Adding Open GitHub Menu Option");
		let _this = this;
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Open GitHub Home'), { reactive: true });
		this.numMenuItem.connect("activate", 
			Lang.bind(this, function() { 
				_this.openUrl("https://github.com/"+_this.gh.username); 
			})
		);
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	},
	
	onSetupError: function() {
		log("Setup Error Occured");
		this.set_applet_tooltip(_("Unable to find user, check settings.js"));
        this.numMenuItem = new PopupMenu.PopupMenuItem(_('Error, check settings.js!'), { reactive: false });
	    this.menu.addMenuItem(this.numMenuItem);
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	},
	
	onLoadGitHubTimer: function() {
		log("onLoadGitHubTimer");
		this.gh.loadDataFeed();
    	this.onUpdateLoadGitHubTimer(this.reloadGitHubFeedTimeout);
	},
	
	onUpdateLoadGitHubTimer: function(timeout) {
		if (this.reloadGitHubFeedTimerId) {
			log("Removing onUpdateLoadGitHubTimer");
			Mainloop.source_remove(this.reloadGitHubFeedTimerId);
			this.reloadGitHubFeedTimerId = 0;
		}
		if (timeout > 0){
			log("Adding onUpdateLoadGitHubTimer");
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

function main(metadata, orientation) {
	let myApplet = new MyApplet(orientation);
	return myApplet;
}

