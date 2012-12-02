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
/** Imports END **/

/** Custom Files START **/
const GitHub=imports.github;
const Settings=imports.settings;
/** Custom Files END **/

const UUID = 'github-projects';

/* Constructor */
function MyApplet(orientation) {
	this._init(orientation);
}

/*
    TextApplet (which show a label in the panel)
    IconApplet (which show an icon in the panel)
    TextIconApplet (which show both an icon and a label in the panel)
    Applet (for hardcore developers, which show an empty box you can fill in yourself)
*/
MyApplet.prototype = {
	__proto__: Applet.IconApplet.prototype,
	
	_init: function(orientation) {
	
	Applet.IconApplet.prototype._init.call(this, orientation);

		try {
			log("Username from settings.js  = " + Settings.username);

			this.set_applet_icon_name("github");
			this.set_applet_tooltip(_("Click here to open GitHub"));
			
			// Menu setup
			this.menuManager = new PopupMenu.PopupMenuManager(this);
			this.menu = new Applet.AppletPopupMenu(this, orientation);
			this.menuManager.addMenu(this.menu);
			
			this.gh=new GitHub.GitHub({
				'username':Settings.username
			});
			log("Username set in GitHub object = " + this.gh.username);
	
			this.addOpenGitHubMenuItem();		
			
			let _this = this;
			this.gh.listRepos(function(isValid, repos){
				log("Callback from listRepos");
				if(isValid){
					log("repos size" + repos.length);
					_this.rebuildMenu(repos);
				}
			});
			
		}
		catch (e) {
			logError(e);
		}
	},
	
    on_applet_clicked: function(event){
        this.menu.toggle();
    },
    	
	rebuildMenu: function(repos) {
		this.menu.removeAll();
		this.addOpenGitHubMenuItem();
		for (i in repos) {
			
			let name = repos[i].name;
			let html_url = repos[i].html_url;
			
			log("repo name = " + name + " | repo url = " + html_url);
			let _this = this;
			var githubRepoMenuItem = new PopupMenu.PopupMenuItem(name);
			githubRepoMenuItem.connect("activate", 
				Lang.bind(this, function() { 
					_this.openUrl(html_url); 
				})
			);
			this.menu.addMenuItem(githubRepoMenuItem);
		}
	},

	openUrl: function(url) {
    	Util.spawnCommandLine("xdg-open " + url);
	},

	addOpenGitHubMenuItem: function() {
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

