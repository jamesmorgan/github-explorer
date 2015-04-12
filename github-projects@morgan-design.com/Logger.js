
/**
 * Simple logging utility
 **/
function Logger(options){
	this.uuid = options.uuid || "";
    this.verboseLogging = options.verboseLogging || false;
}

/**
 * Debug log message
 *
 * @param logMsg
 */
Logger.prototype.debug = function(logMsg){
	if(this.verboseLogging){
		global.log(this.uuid + "::" + logMsg);
	}
};

/**
 * Error log message
 *
 * @param error
 */
Logger.prototype.error = function(error) {
	global.logError(this.uuid + ":: ERROR :: " + error);
};

/**
 * Warning log message
 *
 * @param error
 */
Logger.prototype.warn = function(warning) {
	global.logWarning(this.uuid + ":: WARN :: " + warning);
};