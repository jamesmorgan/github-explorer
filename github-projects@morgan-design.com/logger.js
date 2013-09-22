
/**
 * Simple logging utility
 **/
function Logger(a_params){
	
	this.UUID = "";
	
	if (a_params != undefined){
		this.UUID = a_params.UUID;
		global.log("Setting UUID = " + this.UUID)
	}
}

Logger.prototype.debug = function(logMsg){
	global.log(this.UUID + "::" + logMsg);
}

Logger.prototype.error = function(error) {
	global.logError(this.UUID + ":: ERRROR :: " + error);
}
