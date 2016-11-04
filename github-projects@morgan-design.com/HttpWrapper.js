const Soup = imports.gi.Soup;

function HttpWrapper(user_agent, logger) {

    this.logger = logger;
    this.httpSession = new Soup.SessionAsync();
    this.httpSession.user_agent = user_agent;

    this.addProxyResolverDefault = function () {
        try {
            Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
        } catch (e) {
            throw 'HttpWrapper: Adding ProxyResolverDefault failed: ' + e;
        }
    };

    this.httpGET = function (url, callback) {
        let request = Soup.Message.new('GET', url);
        this.httpSession.queue_message(request, function (session, message) {
            callback(session, message)
        });
    };

}