const Soup = imports.gi.Soup;

function GitHub(a_params){

	this.apiRoot="https://api.github.com";

	this.username=undefined;

	if (a_params != undefined){
		global.log("Setting Username = " + a_params.username);
		this.username=a_params.username;
	}
	
	try {
		this.httpSession = new Soup.SessionAsync();
	} catch (e){ throw 'GitHub: Creating SessionAsync failed: '+e; }

	try {
		Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
	} catch (e){ throw 'GitHub: Adding ProxyResolverDefault failed: '+e; }
}

GitHub.prototype.initialised = function(){
	return this.username != undefined;
}

GitHub.prototype.listRepos = function(responseCallback){
	global.log("Listing repositories, API ROOT = " + this.apiRoot + " | Username = " + this.username);
	
	let this_ = this;
	
	let message = Soup.Message.new('GET', this.apiRoot+"/users/"+this.username+"/repos");

	this.httpSession.queue_message(message, function(session,message){
		if (message.status_code !== 200) {
			responseCallback(false, null);
			return;
		}
		
		var responseJson = this_.parseJsonResponse(message);
		global.log("responseJson = " + responseJson);
		
		global.log("Response Callback invoked!");
		responseCallback(true, responseJson);
	});
}

GitHub.prototype.parseJsonResponse = function(request){
	var rawResponseJSON = request.response_body.data;
	var jsonResponse = JSON.parse(rawResponseJSON);
	return jsonResponse;
}


