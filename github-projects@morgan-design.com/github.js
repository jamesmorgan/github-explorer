const Soup = imports.gi.Soup;
const Lang = imports.lang;

/**
 * Simple Object to encapsulate all access and dealings with github
 **/
function GitHub(options){
					
	this.username			= options.username;	/** Username for GitHub **/
	this.version			= options.version;	/** Version of application, used in API request **/
	this.logger				= options.logger;	/** The Logger **/
	
	this.apiRoot			= "https://api.github.com";
	this.user_agent 		= "Cinnamon-GitHub-Explorer/" + this.version; 
	
	this.totalFailureCount 	= 0; 		/** Count Number of failures to prevent **/
	this.lastAttemptDateTime= undefined;/** The last time we checked GitHub **/

	this.callbacks	= {};
	
	/** Log verbosely **/
	this.logger.debug("GitHub : Setting Username  = " + this.username);
	this.logger.debug("GitHub : Setting UserAgent = " + this.user_agent);
	this.logger.debug("GitHub : Setting Version	  = " + this.version);
	
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

/**
 * Invoked on a failed request
 **/
GitHub.prototype.onFailure = function(failureCallback){
	this.callbacks.onFailure = failureCallback;
}

/**
 * Invoked on a sucessful request
 **/
GitHub.prototype.onSuccess = function(successCallback){
	this.callbacks.onSuccess = successCallback;
}

GitHub.prototype.loadDataFeed = function(){

	this.lastAttemptDateTime = new Date(); // Update the attempted date

	var feedUrl = this.apiRoot+"/users/"+this.username+"/repos";
	
	let _this = this;
	let request = Soup.Message.new('GET', feedUrl);
	
	// Add event listener for headers
	request.connect('got_headers', Lang.bind(this, function(message){
		this.logger.debug("Header [X-RateLimit-Limit]: " + message.response_headers.get_one("X-RateLimit-Limit"));
		this.logger.debug("Header [X-RateLimit-Remaining]: " + message.response_headers.get_one("X-RateLimit-Remaining"));
	}));

	this.httpSession.queue_message(request, function(session, message){
		_this.onHandleFeedResponse(session, message)
	});	
}

GitHub.prototype.getLastAttemptDateTime = function(){
	return this.lastAttemptDateTime;
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
			this.callbacks.onFailure(message.status_code, responseJson.message);
		}
		this.totalFailureCount++;
		return;
	}
	
	try {
		this.totalFailureCount = 0; // Reset failure count on success
		this.callbacks.onSuccess(responseJson);
	} catch(e) {
		this.logger.error("Problem with response callback response " + e);
	}
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	return JSON.parse(rawResponseJSON);
}
