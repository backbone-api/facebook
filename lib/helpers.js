
// Helpers
// Sync method
var Sync = function(method, model, options) {

	var url = (this.url instanceof Function) ? this.url() : this.url;
	var params = {};

	// add access token if available
	var token = this.getToken();
	if( token ){
		if( url instanceof Object) { url.access_token = token; }
		else { url += ( url.search(/\?/) > -1 ) ? "&access_token="+ token : "?access_token="+ token; }
	}

	//FB.api(url, method, params, function( response ) {
	FB.api(url, method, function( response ) {
		// save response.paging for later?
		// send just the response.data:
		var data = response.data || response;

		options.success( data );
	});

};

var getToken = function(){
	// first priority have the local options
	if( this.options && this.options.access_token) return this.options.access_token;
	// after that the internal token
	if( !_.isUndefined( token.get("accessToken") ) ) return token.get("accessToken");
	// no token
	return false;
};
