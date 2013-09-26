const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

function Settings() {
    this._init();
}

Settings.prototype = {
	
    _init: function() {
		this.settingsFile = ARGV[0];
		
        this.builder = new Gtk.Builder();
        this.builder.add_from_file("settings.glade");

        this.window = this.builder.get_object("windowMain");
        this.window.connect("destroy", Gtk.main_quit);
        
		this.builder.get_object("buttonSave").connect("clicked", Lang.bind(this, this.save));
        this.builder.get_object("buttonCancel").connect("clicked", Lang.bind(this, this.close));
        
        this.scaleRefreshInterval = this.builder.get_object("scaleRefreshInterval");
        this.enableAutoUpdateBtn = this.builder.get_object("enableAutoUpdateBtn");
 		this.gitHubUsernameInputText = this.builder.get_object("gitHubUsernameInputText");
    },
    
    save: function() {
 		try {
			print("Saving settings");
			this.settings.refreshInterval = this.scaleRefreshInterval.get_value();
			this.settings.enableAutoUpdate = this.enableAutoUpdateBtn.get_active();
		    this.settings.username = this.gitHubUsernameInputText.get_text();
		    this.saveSettings();
			this.close();
		} catch(e) {
			print(e);
			errorMessage = new Gtk.MessageDialog({title: "Error saving settings", buttons: Gtk.ButtonsType.OK, text: e+""});
			errorMessage.run();
		}
	},
	
	close: function() {
		this.window.destroy();
	},
	
	loadSettings: function() {
		try {
			let file = Gio.file_new_for_path(this.settingsFile);
			[success, jsonString, tag] = file.load_contents(null);
			this.settings = JSON.parse(jsonString);
			
			this.scaleRefreshInterval.set_value(this.settings.refreshInterval);
			this.gitHubUsernameInputText.set_text(this.settings.username);
			this.enableAutoUpdateBtn.set_active(this.settings.enableAutoUpdate);
						
			return true;
		} catch(e) {
			print(e);
			errorMessage = new Gtk.MessageDialog({title: "Error loading settings", buttons: Gtk.ButtonsType.OK, text: e+""});
			errorMessage.run();
			return false;
		}
	},
	
	saveSettings: function() {
		try {
			let file = Gio.file_new_for_path(this.settingsFile);
			file.replace_contents(JSON.stringify(this.settings), null, false, 0, null);
		} catch(e) {
			print(e);
			errorMessage = new Gtk.MessageDialog({title: "Error saving settings", buttons: Gtk.ButtonsType.OK, text: e+""});
			errorMessage.run();
		}
	}
}


Gtk.init(null);
let settings = new Settings();
let ok = settings.loadSettings();
if(ok) {
	settings.window.show_all();
	Gtk.main();
}

