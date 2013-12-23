
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
const Settings = imports.ui.settings;

const Notify = imports.gi.Notify;

function main(metadata, orientation) {
	let myApplet = new MyApplet(metadata, orientation);
	return myApplet;
}

function MyApplet(metadata, orientation) {
	this._init(metadata, orientation);
}

MyApplet.prototype = {
	__proto__: Applet.IconApplet.prototype,

	_init: function(metadata, orientation, instance_id) {
	
	this.metadata = metadata;

	Applet.IconApplet.prototype._init.call(this, orientation, instance_id);
		try {
			this._notifySendExample("<b>bold text</b>");			// Simple Bold text
			this._notifySendExample("<i>italic text</i>");			// Simple Italic text
			this._notifySendExample("<u>underlined text</u>");		// Simple Underline text
			this._notifySendExample("<a href='http://test.com'>test</a>");	// Simple Hyperlink
			this._notifySendExample("<img src='http://www.google.co.uk/images/icons/product/chrome-48.png' alt='alt text'/>");	// Simple Image
			
			/**
			this._notifyNotificationExample("Body");				// Simple Bold text		
			this._notifyNotificationExample("Body <i>italic text</i>");			// Simple Italic text
			this._notifyNotificationExample("Body <u>underlined text</u>");			// Simple Underline text
			this._notifyNotificationExample("Body <a href='http://test.com'>test</a>");	// Simple Hyperlink
			this._notifyNotificationExample("Body <img src='' alt='alt text'/>");	// Simple Image
			**/
		}
		catch (e) {
			global.logError(e);
		}
	},
		
	_notifySendExample: function(extras){
		let notification = "notify-send --icon=gtk-add 'Test' 'Body " + extras + "' -t 5 -u low";
		Util.spawnCommandLine(notification);
	},
	
	_notifyNotificationExample: function(bodyContent){
		Notify.init("notify-test");	
		var notification = new Notify.Notification({
				summary: "File Notification",
				body: "some content" 
			});
		notification.show();
	}	
};
