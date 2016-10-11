const Logger = imports.Logger;
const Util = imports.misc.util;

/* Notifier is responsible for desktop notifications */
function Notifier(settings, metadata, appletIcon) {
    global.log("Notifier Start INIT");
    //this._init.apply(this, arguments);

    global.log("Notifier 1.1");
    this.settings = settings;
    global.log("Notifier 1.2 + appletIcon = " + appletIcon);
    this.metadata = metadata;
    this.appletIcon = appletIcon;
    global.log("Notifier 1.3 - this.metadata.uuid " + this.metadata.uuid);
    this.logger = new Logger.Logger({
        name: "Notifier",
        uuid: this.metadata.uuid,
        verboseLogging: this.settings.getValue("enable-verbose-logging")
    });
    global.log("Notifier 1.4  sdzsdasdasd");

    global.log("Notifier Stop INIT");
}

/**
 * A map of notifications
 */
//Notifier.prototype.NOTIFICATIONS = {
//    LOADING: {title: "GitHub Explorer", content: "Attempting to Load your GitHub Repos"},
//    LOADING_SUCCESS: {title: "GitHub Explorer", content: "Successfully Loaded GitHub Repos for user ", append: "USER_NAME"},
//    LOADING_ERROR: {title: "ERROR:: GitHub Explorer ::ERROR", content: "Failed to load GitHub Repositories! Check applet Configuration"}
//};

/* Constructor */
Notifier.prototype._init = function (settings, metadata) {
    //global.log("Notifier 1.1");
    //this.settings = settings;
    //global.log("Notifier 1.2");
    //this.metadata = metadata;
    //global.log("Notifier 1.3 - this.metadata.uuid " + this.metadata.uuid);
    //this.logger = new Logger.Logger({
    //    uuid: this.metadata.uuid,
    //    verboseLogging: this.settings.getValue("enable-verbose-logging")
    //});
    //global.log("Notifier 1.4");
};

/**
 * A map of notifications
 */
Notifier.prototype.NOTIFICATIONS = {
    LOADING: {
        title: "GitHub Explorer",
        content: "Attempting to Load your GitHub Repos"
    },
    LOADING_SUCCESS: {
        title: "GitHub Explorer",
        content: "Successfully Loaded GitHub Repos for user ",
        append: "USER_NAME"
    },
    LOADING_ERROR: {
        title: "ERROR:: GitHub Explorer ::ERROR",
        content: "Failed to load GitHub Repositories! Check applet Configuration"
    }
};

/**
 * Launch a notification
 *
 * @param notification
 */
Notifier.prototype.notify = function (notification) {
    global.log("notify + appletIcon = " + this.appletIcon);
    let msg = notification.content;
    switch (notification.append) {
        case "USER_NAME":
            msg += this.gh.username;
    }
    let message = "notify-send \"" + notification.title + "\" \"" + msg + "\" -i " + this.appletIcon + " -a GIT_HUB_EXPLORER -t 10 -u low";
    this.logger.debug("notification call = [" + message + "]");
    Util.spawnCommandLine(message);
};

//};
