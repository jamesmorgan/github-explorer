const Soup = imports.gi.Soup;
const Lang = imports.lang;

const API_ROOT = "https://api.github.com";

function GitHubOAuth(options) {
    this._init(options);
}

GitHubOAuth.prototype = {

    _init: function(options) {
        this._authToken = options.authToken;
    },
   
   _request: function(){
        let request = Soup.Message.new('GET', feedUrl);

        this.httpSession.queue_message(request, function(session, message){
           _this.onHandleFeedResponse(session, message)
        });
   },
   
   _authenticate: function(){
        // "https://api.github.com/?access_token=OAUTH-TOKEN"   
   },
   
   
   
 

}
