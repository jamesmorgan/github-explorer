/**
 * Simple logging utility
 **/
function Logger(options) {
    this.uuid = options.uuid || "";
    this.verboseLogging = options.verboseLogging || false;
    this.name = (options.name ? options.name + " :: " : "");
}

/**
 * Debug log message
 *
 * @param logMsg
 */
Logger.prototype.debug = function (logMsg) {
    if (this.verboseLogging) {
        global.log(this.uuid + " :: " + this.name + logMsg);
    }
};

/**
 * Error log message
 *
 * @param error
 */
Logger.prototype.error = function (error) {
    global.logError(this.uuid + " :: ERROR :: " + this.name + error);
};

/**
 * Warning log message
 *
 * @param warning
 */
Logger.prototype.warn = function (warning) {
    global.logWarning(this.uuid + " :: WARN :: " + this.name + warning);
};