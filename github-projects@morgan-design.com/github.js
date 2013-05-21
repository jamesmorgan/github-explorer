const Soup = imports.gi.Soup;

function GitHub(a_params, logger){
	this.apiRoot="https://api.github.com";

	this.username=undefined;
	
	this.logger = logger;
	this.user_agent = "Cinnamon-GH-Explorer/" + a_params.version;
	//Count Number of failures to prevent 
	this.totalFailureCount = 0;

	this.callbacks={
		onError:undefined,
		onNewFeed:undefined
	};

	if (a_params != undefined){
		this.logger.logVerbose("Setting Username = " + a_params.username);
		this.username=a_params.username;
		if (a_params.callbacks!=undefined){
			this.callbacks.onError=a_params.callbacks.onError;
			this.callbacks.onNewFeed=a_params.callbacks.onNewFeed;
		}
	}
	try {
		this.httpSession = new Soup.SessionAsync();
		this.logger.logVerbose("Setting UserAgent = " + this.user_agent);
		this.httpSession.user_agent = this.user_agent;
	} catch (e){ throw 'GitHub: Creating SessionAsync failed: '+e; }
	
	try {
		Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
	} catch (e){ throw 'GitHub: Adding ProxyResolverDefault failed: '+e; }
}

GitHub.prototype.initialised = function(){
	return this.username != undefined 
		&& this.callbacks.onError != undefined 
		&& this.callbacks.onNewFeed != undefined;
}

GitHub.prototype.loadDataFeed = function(){
	this.logger.logVerbose("Loading DataFeed API ROOT = " + this.apiRoot + " | Username = " + this.username);
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

	this.logger.logVerbose("totalFailuresAllowed " + this.totalFailuresAllowed);
	this.logger.logVerbose("totalFailureCount " + this.totalFailureCount);
	this.logger.logVerbose("Allowed error message: " + allowedToError);
	
	return allowedToError;
}

GitHub.prototype.onHandleFeedResponse = function(session, message) {

	var responseJson = this.parseJsonResponse(message);

	if (message.status_code !== 200) {
		this.logger.log("Error status code of: " + message.status_code + " | message: " + responseJson.message);

		// Only show error message if not already shown it several times!		
		if(this.notOverFailureCountLimit()){
			this.logger.logVerbose("Showing error message as not over allowed failure limit!");
			this.callbacks.onError(message.status_code, responseJson.message);
		}
		this.totalFailureCount++;
		return;
	}
	
	try {
		if (this.callbacks.onNewFeed != undefined){
			this.totalFailureCount = 0; // Reset failure count on success
			this.logger.logVerbose("onNewFeed callbacks triggered");
			this.callbacks.onNewFeed(responseJson);
		}else{
			this.logger.logVerbose("ERROR onNewFeed callback NOT FOUND!");
		}
	} catch (e){
		this.logger.logVerbose("ERROR triggering new feed "  + e);
	}
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	var jsonResponse = JSON.parse(rawResponseJSON);
	return jsonResponse;
}

