const Soup = imports.gi.Soup;

function GitHub(a_params, logger){
	
	this.apiRoot="https://api.github.com";
	
	this.logger 			= logger;	/** The Logger **/
	this.isInitialised 		= false;	/** Marker for correct github setup **/
	this.username 			= undefined;/** Username for GitHub **/
	this.user_agent 		= undefined;/** Version of application, used in API request **/
	this.totalFailureCount 	= 0; 		/** Count Number of failures to prevent **/
					
	/** The Magic Callbacks **/
	this.callbacks={ 
		onError:undefined,		/** Callback for Errors  **/
		onNewFeed:undefined 	/** Callback for New Project Feed Recieved  **/
	};
	
	/** 
	 * Error checking and and Setup Evaluation 
	 * We must attempt to atleast try and ensure we have the correct setup for allowing the GitHub request
	 * On certain errors we will not be able to show the problem to the user
	 **/
	
	// Invalid GitHub setup - report error
	if(!a_params && a_params == undefined){
		this.logger.error("a_params not found"); 
	}
	
	// Invalid GitHub setup - report error
	var properties = ['version','username','callbacks'];
	for (var prop in properties)
	{
		if(a_params[properties[prop]] == undefined){
			this.logger.error("Property [" + properties[prop] + "] not found"); 
		}
	}

	// Invalid callback setup - report fatal error
	var functions = ['onError','onNewFeed'];
	for (var func in functions)
	{
		if(!(typeof a_params.callbacks[functions[func]] === 'function')){
			this.logger.error("Function [" + functions[func] + "] not found"); 
		}
	}
	
	/**
	 * Actually assign the value to the correct fields
	 **/
	
	this.user_agent = "Cinnamon-GitHub-Explorer/" + a_params.version;
	this.username=a_params.username;
	
	this.callbacks.onError = a_params.callbacks.onError;
	this.callbacks.onNewFeed = a_params.callbacks.onNewFeed;

	/** Log verbosely **/
	this.logger.debug("GitHub : Setting Username  = " + this.username);
	this.logger.debug("GitHub : Setting UserAgent = " + this.user_agent);
	
	try {
		this.httpSession = new Soup.SessionAsync();
		this.httpSession.user_agent = this.user_agent;
	} catch(e) { 
		throw 'GitHub: Creating SessionAsync failed: ' + e; 
	}
	
	try {
		Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
	} catch(e) { 
		throw 'GitHub: Adding ProxyResolverDefault failed: ' + e; 
	}
	
	/** Fully setup so mark as initialised **/
	this.isInitialised = true;
}

GitHub.prototype.initialised = function(){
	return this.isInitialised;
}

GitHub.prototype.loadDataFeed = function(){
	this.logger.debug("Loading DataFeed API ROOT = " + this.apiRoot + " | Username = " + this.username);
	var feedUrl = this.apiRoot+"/users/"+this.username+"/repos";
	
	let _this = this;
	let message = Soup.Message.new('GET', feedUrl);
	this.httpSession.queue_message(message, function(session,message){
		_this.onHandleFeedResponse(session,message)
	});	
}

// Number of failures allowed
GitHub.prototype.totalFailuresAllowed = 5;
GitHub.prototype.notOverFailureCountLimit = function() {
	let allowedToError = this.totalFailuresAllowed >= this.totalFailureCount;

	this.logger.debug("totalFailuresAllowed " + this.totalFailuresAllowed);
	this.logger.debug("totalFailureCount " + this.totalFailureCount);
	this.logger.debug("Allowed error message: " + allowedToError);
	
	return allowedToError;
}

GitHub.prototype.onHandleFeedResponse = function(session, message) {

	var responseJson = this.parseJsonResponse(message);

	if (message.status_code !== 200) {
		this.logger.debug("Error status code of: " + message.status_code + " | message: " + responseJson.message);

		// Only show error message if not already shown it several times!		
		if(this.notOverFailureCountLimit()){
			this.logger.error("Showing error message as not over allowed failure limit!");
			this.callbacks.onError(message.status_code, responseJson.message);
		}
		this.totalFailureCount++;
		return;
	}
	
	try {
		if (this.callbacks.onNewFeed != undefined){
			this.totalFailureCount = 0; // Reset failure count on success
			this.logger.debug("onNewFeed callbacks triggered");
			this.callbacks.onNewFeed(responseJson);
		}else{
			this.logger.debug("ERROR onNewFeed callback NOT FOUND!");
		}
	} catch (e){
		this.logger.error("ERROR triggering new feed "  + e);
	}
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	var jsonResponse = JSON.parse(rawResponseJSON);
	return jsonResponse;
}

