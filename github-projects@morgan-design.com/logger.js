
function Logger(a_params){
	
	this.verboseLogging  = false;
	
	this.UUID = "";
	
	if (a_params != undefined){
		this.verboseLogging=a_params.verboseLogging;
		global.log("Setting verbose logging = " + this.verboseLogging)
		
		this.UUID = a_params.UUID;
		global.log("Setting UUID = " + this.UUID)
	}
}

Logger.prototype.enableVerboseLogging = function(enabled){
	this.log("Setting verbose logging enable = " + enabled);
	this.verboseLogging = enabled;
}

Logger.prototype.log = function(logMsg){
	global.log(this.UUID + "::" + logMsg);
}

Logger.prototype.logVerbose = function(logMsg){
	if(this.verboseLogging){
		global.log(this.UUID + "::" + logMsg);
	}
}

Logger.prototype.logError = function(error) {
	global.logError(this.UUID + "::" + error);
}
