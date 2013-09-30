const Soup = imports.gi.Soup;

/**
 * Simple Object to encapsulate all access and dealings with github
 **/
function GitHub(a_params, logger){
	
	this.apiRoot="https://api.github.com";
	
	this.logger 			= logger;	/** The Logger **/
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
}


GitHub.prototype.loadDataFeed = function(){

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
	return this.totalFailuresAllowed >= this.totalFailureCount;
}

GitHub.prototype.onHandleFeedResponse = function(session, message) {

	var responseJson = this.parseJsonResponse(message);

	if (message.status_code !== 200) {
		this.logger.error("HTTP Response Status code [" + message.status_code + "] Message: " + responseJson.message);

		// Only show error message if not already shown it several times!		
		if(this.notOverFailureCountLimit()){
			this.callbacks.onError(message.status_code, responseJson.message);
		}
		this.totalFailureCount++;
		return;
	}
	
	try {
		this.totalFailureCount = 0; // Reset failure count on success
		this.callbacks.onNewFeed(responseJson);
	} catch(e) {
		this.logger.error("Problem with response callback response " + e);
	}
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	return JSON.parse(rawResponseJSON);
}
