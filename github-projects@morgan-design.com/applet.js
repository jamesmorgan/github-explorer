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

        try {
            this.set_applet_icon_path(APPLET_ICON);

            let self = this;

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

            // Loop round lots to fill the screen and create the scrollable view
            for (i = 0; i < 60; i++) {

                // Main Menu Item
                let menuItem1 = new PopupMenu.PopupSubMenuMenuItem("Sub Menu");
                let imgSubMenuItem1 = this._createPopupImageMenuItem("Image Sub Menu Item 1", "web-browser-symbolic", function () {
                    global.log("Clicked!");
                });
                let imgSubMenuItem2 = this._createPopupImageMenuItem("Image Sub Menu Item 2", "web-browser-symbolic", function () {
                    global.log("Clicked!");
                });
//                openRepoItem.actor._parent_container = this._maincontainer;
                menuItem1.actor.reactive = true;
                menuItem1.actor.can_focus = true;
                menuItem1.menu.addMenuItem(imgSubMenuItem1);
                menuItem1.menu.addMenuItem(imgSubMenuItem2);

                this._notificationbin.add(menuItem1.actor);
                menuItem1.actor._parent_container = this._notificationbin;
            }
        }
        catch (e) {
            global.logError(e);
        }
    },

    on_applet_clicked: function (event) {
        this.menu.toggle();
    },

    on_applet_removed_from_panel: function () {
        this.settings.finalize(); // We want to remove any connections and file listeners here
    },

    _createPopupImageMenuItem: function (title, icon, bindFunction, options) {
        let options = options || {};
        let openRepoItem = new PopupMenu.PopupImageMenuItem(title, icon, options);
        openRepoItem.connect("activate", Lang.bind(this, bindFunction), { reactive: true });
        return openRepoItem;
    }

};
