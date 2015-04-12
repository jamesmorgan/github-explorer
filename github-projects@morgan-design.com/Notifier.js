const Logger = imports.Logger;
const Util = imports.misc.util;

/* Notifier is responsible for desktop notifications */
function Notifier() {
    this._init.apply(this, arguments);
}

/**
 * A map of notifications
 */
Notifier.prototype.NOTIFICATIONS = {
    LOADING: {title: "GitHub Explorer", content: "Attempting to Load your GitHub Repos"},
    LOADING_SUCCESS: {title: "GitHub Explorer", content: "Successfully Loaded GitHub Repos for user ", append: "USER_NAME"},
    LOADING_ERROR: {title: "ERROR:: GitHub Explorer ::ERROR", content: "Failed to load GitHub Repositories! Check applet Configuration"}
};

Notifier.prototype = {

    /* Constructor */
    _init: function (settings) {
        this.settings = settings;
        this.logger = new Logger.Logger({
            uuid: this.metadata.uuid,
            verboseLogging: this.settings.getValue("enable-verbose-logging")
        });
    },

    /**
     * Launch a notification
     *
     * @param notification
     */
    notify: function (notification) {
        let msg = notification.content;
        switch (notification.append) {
            case "USER_NAME":
                msg += this.gh.username;
        }
        let message = "notify-send \"" + notification.title + "\" \"" + msg + "\" -i " + APPLET_ICON + " -a GIT_HUB_EXPLORER -t 10 -u low";
        this.logger.debug("notification call = [" + message + "]");
        Util.spawnCommandLine(message);
    }

};
