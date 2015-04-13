const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;

const Logger = imports.Logger;

function SettingsWrapper() {
    this._init.apply(this, arguments);
}

SettingsWrapper.prototype = {

    /* Constructor */
    _init: function (app, metadata, instance_id, on_settings_changed) {

        this.metadata = metadata;

        this.prototype.settings = new Settings.AppletSettings(app, metadata.uuid, instance_id);

        // Set version from metadata
        this.prototype.settings.setValue("applet-version", metadata.version);

        this.logger = new Logger.Logger({
            uuid: this.metadata.uuid,
            verboseLogging: this.prototype.settings.getValue("enable-verbose-logging")
        });

        this.bindProps(on_settings_changed);
    },

    open: function () {
        Util.spawnCommandLine("cinnamon-settings applets " + this.metadata.uuid);
    },

    /**
     * Set settings value
     *
     * @param key
     * @param value
     */
    setValue: function (key, value) {
        this.prototype.settings.setValue(key, value);
    },

    /**
     * Get value
     *
     * @param key
     * @return {*}
     */
    getValue: function (key) {
        return this.prototype.settings.getValue(key);
    },

    /**
     * Remove any connections and file listeners
     */
    finalize: function () {
        this.prototype.settings.finalize();
    },

    /**
     * Bind to all Settings Properties
     *
     * @param on_settings_changed the change handler to invoke when settings change
     */
    bindProps: function (on_settings_changed) {

        /* Args:
         * The binding direction - IN means we only listen for changes from this applet
         * The setting key, from the setting schema file
         * The property to bind the setting to - in this case it will initialize this.icon_name to the setting value
         * The method to call when this.icon_name has changed, so you can update your applet
         * Any extra information you want to pass to the callback (optional - pass null or just leave out this last argument)
         */
        this.settings.bindProperty(Settings.BindingDirection.IN, "username", "username", on_settings_changed, null);

        this.settings.bindProperty(Settings.BindingDirection.IN, "enable-auto-refresh", "enable_auto_refresh", on_settings_changed, null);

        this.settings.bindProperty(Settings.BindingDirection.IN, "enable-verbose-logging", "enable_verbose_logging", on_settings_changed, null);

        this.settings.bindProperty(Settings.BindingDirection.IN, "enable-github-change-notifications", "enable_github_change_notifications", on_settings_changed, null);

        this.settings.bindProperty(Settings.BindingDirection.IN, "refresh-interval", "refresh_interval", on_settings_changed, null);

        this.settings.bindProperty(Settings.BindingDirection.IN, "show-issues-icon-on-repo-name", "show_issues_icon_on_repo_name", on_settings_changed, null);
    }
};
