/** Imports START **/
const Lang = imports.lang;
const Applet = imports.ui.applet;
const GLib = imports.gi.GLib;
const Gettext = imports.gettext.domain('cinnamon-applets');
const _ = Gettext.gettext;
/** Imports END **/

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
			this.set_applet_icon_name("force-exit");
			this.set_applet_tooltip(_("Click here to kill a window"));
		}
		catch (e) {
			/* Write any errors to global error log */
			/* if anything goes wrong, you can see the error in Looking Glass: 
			Press Alt F2, type “lg” and click on the “errors” tab. 8 */
			global.logError(e);
		}
	},
	/* tell Cinnamon to launch xkill when the user clicks on our applet: */
	on_applet_clicked: function(event) {
		GLib.spawn_command_line_async('xkill');
	}
};

/* likely to be the same in every applet… it instantiates our applet and returns it to Cinnamon */
function main(metadata, orientation) {
	let myApplet = new MyApplet(orientation);
	return myApplet;
}

