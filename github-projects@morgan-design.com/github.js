const Soup = imports.gi.Soup;

function GitHub(a_params){
	this.apiRoot="https://api.github.com";

	this.username=undefined;

	this.callbacks={
		onError:undefined,
		onNewFeed:undefined
	};

	if (a_params != undefined){
		global.log("Setting Username = " + a_params.username);
		this.username=a_params.username;
		if (a_params.callbacks!=undefined){
			this.callbacks.onError=a_params.callbacks.onError;
			this.callbacks.onNewFeed=a_params.callbacks.onNewFeed;
		}
	}
	try {
		this.httpSession = new Soup.SessionAsync();
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
	global.log("Loading DataFeed API ROOT = " + this.apiRoot + " | Username = " + this.username);
	var feedUrl = this.apiRoot+"/users/"+this.username+"/repos";
	global.log("feedUrl = " + feedUrl);
	
	let this_ = this;
	let message = Soup.Message.new('GET', feedUrl);
	this.httpSession.queue_message(message, function(session,message){
		global.log("Loaded github feed");
		this_.onHandleFeedResponse(session,message)
	});	
}

GitHub.prototype.onHandleFeedResponse = function(session, message) {
	if (message.status_code !== 200) {
		global.log("Error status code of: " + message.status_code);
		this.callbacks.onError(message.status_code);
		return;
	}
	var responseJson = this.parseJsonResponse(message);
	global.log("responseJson = " + responseJson);
	
	try {
		if (this.callbacks.onNewFeed != undefined){
			global.log("onNewFeed callbacks triggered");
			this.callbacks.onNewFeed(responseJson);
		}else{
			global.log("ERROR onNewFeed callbacks NOT FOUND");
		}
	} catch (e){
		global.log("ERROR triggering new feed "  + e);
	}
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	var jsonResponse = JSON.parse(rawResponseJSON);
	return jsonResponse;
}

