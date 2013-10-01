const Soup = imports.gi.Soup;
const Lang = imports.lang;

const API_ROOT = "https://api.github.com";

/**
 * Simple Object to encapsulate all access and dealings with github
 **/
function GitHub(options){
					
	this.username			= options.username;	/** Username for GitHub **/
	this.version			= options.version;	/** Version of application, used in API request **/
	this.logger				= options.logger;	/** The Logger **/
	
	this.user_agent 		= "Cinnamon-GitHub-Explorer/" + this.version; /** User agent passed when making API requests **/
	
	this.totalFailureCount 	= 0; 		/** Count Number of failures to prevent **/
	this.lastAttemptDateTime= undefined;/** The last time we checked GitHub **/

	this.apiLimit			= 0; /** Max number of requests per hour **/
	this.apiLimitRemaining 	= 0; /** Remaining number of requests in hour **/

	/** The magic callbacks **/
	this.callbacks = {}
	this.callbacks.onFailure	= {};
	this.callbacks.onSuccess	= {};
	this.callbacks.onRejection	= {};
	
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

/**
 * Invoked on a successful request but a rejection by GitHub
 **/
GitHub.prototype.onRejectedByGitHub = function(rejectedCallback){
	this.callbacks.onRejection = rejectedCallback;
}

GitHub.prototype.loadDataFeed = function(){
	
	this.lastAttemptDateTime = new Date(); // Update the attempted date

	var feedUrl = API_ROOT+"/users/"+this.username+"/repos";
	
	let _this = this;
	
	let request = Soup.Message.new('GET', feedUrl);
	
	// Add event listener for headers
	request.connect('got_headers', Lang.bind(this, function(message){
		this.apiLimit			= message.response_headers.get_one("X-RateLimit-Limit");
		this.apiLimitRemaining 	= message.response_headers.get_one("X-RateLimit-Remaining");
//		this.logger.debug("Header [X-RateLimit-Limit]: " + this.apiLimit);
//		this.logger.debug("Header [X-RateLimit-Remaining]: " + this.apiLimitRemaining);
	}));

	this.httpSession.queue_message(request, function(session, message){
		_this.onHandleFeedResponse(session, message)
	});	
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

// Number of failures allowed
// TODO remove me!
GitHub.prototype.totalFailuresAllowed = 5;

GitHub.prototype.notOverFailureCountLimit = function() {
	return this.totalFailuresAllowed >= this.totalFailureCount;
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	return JSON.parse(rawResponseJSON);
}
