/* Backbone API: Facebook
 * Source: https://github.com/backbone-api/facebook
 *
 * Created by Makis Tracend (@tracend)
 * Distributed through [Makesites.org](http://makesites.org)
 * Released under the [MIT license](http://makesites.org/licenses/MIT)
 */

// Assuming that Facebook JS lib is loaded...
if( window.FB ) (function(_, Backbone) {

	// Fallbacks
	//APP = window.APP || (APP = { Models: {}, Collections: {}, Views: {} });
	if( _.isUndefined(Backbone.API) ) Backbone.API = {};

	// Namespace definition
	Backbone.API.Facebook = {
		Models : {},
		Collections : {},
		Views : {}
	};


	// Helpers
	// Sync method
	var Sync = function(method, model, options) {

		var url = (this.url instanceof Function) ? this.url() : this.url;
		var params = {};

		// add access token if available
		var token = this.getToken();
		if( token ){
			if( url instanceof Object) { url["access_token"] = token; }
			else { url += "&access_token="+ token; }
		}

		//FB.api(url, method, params, function( response ) {
		FB.api(url, function( response ) {
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
	}


	// Models

	// - Main Constructor
	var Model = Backbone.Model.extend({
		fetch : function(method, model, options) {
			var self = this;

			if( this.getToken() ){
				// we'll be using the supplied access token
				Backbone.Model.prototype.fetch.call( self );
			} else {
				FB.getLoginStatus(function(response){
					if( response.status == "connected" ){
						// save token
						token.set( response.authResponse );
						// continue with request
						Backbone.Model.prototype.fetch.call( self );
					}
					// else try to FB.Login?
				});
			}
		},
		sync: Sync,
		getToken: getToken
	});

	//
	Backbone.API.Facebook.Models.User = Model.extend({
		defaults : {
			//installed : true
		}
	});

	Backbone.API.Facebook.Models.Feed = Model.extend({
		defaults : {}
	});

	Backbone.API.Facebook.Models.Post = Model.extend({
		defaults : {
			method: "feed",
			link: "",
			picture: "",
			name: "",
			caption: "",
			description: ""
		}
	});

	Backbone.API.Facebook.Models.Page = Model.extend({
		defaults : {
			method: "oauth",
			client_id: false,
			redirect_uri: ""
		},
		isFan: function( uid ){
			uid = uid || "me()";
			return (new isFan({ id : this.id, uid : uid }) ).fetch();
		}

	});

	//
	Backbone.API.Facebook.Models.Link = Model.extend({
		defaults : {
			url: window.location.href,
			normalized_url: "",
			share_count: 0,
			like_count: 0,
			comment_count: 0,
			total_count: 0,
			commentsbox_count: 0,
			comments_fbid: 0,
			click_count: 0
		},
		url: function(){
			return {
				method: 'fql.query',
				query: "SELECT url,normalized_url,share_count,like_count,comment_count,total_count,commentsbox_count,comments_fbid,click_count FROM link_stat WHERE url ='"+ this.get("url") +"'"
			}
		},
		initialize: function( model, options){
			// fallback
			options = options || {};
			// auto-fetch if requested...
			if( options.fetch ){
				this.fetch();
			}
		},

		parse: function( response ){
			// error control?
			//console.log( response );
			// use only the first item
			return response.shift();
		}
	});

	Backbone.API.Facebook.Models.Login = Model.extend({
		defaults : {
			method: "oauth",
			client_id: false, //fb_appId
			redirect_uri: "" //https://apps.facebook.com/'+ fb_uri +'/'
		}
	});

	Backbone.API.Facebook.Models.AddToPage = Model.extend({
		defaults : {
		  method: 'pagetab',
		  redirect_uri: '', //https://apps.facebook.com/{{fb_uri}}/
		}
	});

	// Me is an extension of the user
	Backbone.API.Facebook.Models.Me = Backbone.API.Facebook.Models.User.extend({
		url : "/me",
		defaults : {
			id : "me"
		},
		// defaultOptions: {
		options : {
			// see https://developers.facebook.com/docs/authentication/permissions/
			scope: [], // fb permissions
			//autoFetch: true, // auto fetch profile after login
			protocol: location.protocol
		},

		initialize: function(){
			var self = this;
			FB.Event.subscribe('auth.authResponseChange', function(e){ self.onLoginStatusChange(e) });
			return Backbone.API.Facebook.Models.User.prototype.apply(this, arguments);
		},

		login: function(callback){
			callback =  callback || function() {};
			FB.login(callback, { scope: this.options.scope.join(',') });
		},

		logout: function(){
			FB.logout();
		},

		onLoginStatusChange: function(response) {
			if(this.options.auth === response.status) return false;

			var event;

			if(response.status === 'not_authorized') {
				event = 'facebook:unauthorized';
			} else if (response.status === 'connected') {
				event = 'facebook:connected';
				if(this.options.autoFetch === true) this.fetch();
			} else {
				event = 'facebook:disconnected';
			}

			this.trigger(event, this, response);
			this.options.auth = response.status;
		}

	});

	Backbone.API.Facebook.Models.WebPage = Backbone.Model.extend({

		defaults : {
			"shares": 0,
			"comments": 0,
			"type": "website",
			"is_scraped": false
		},

		options: {

		},

		url: function(){ return "https://graph.facebook.com/?ids="+ this.options.page },

		initialize: function(model, options){
			options = options || {};
			this.options = _.extend(this.options, options);
			return Backbone.Model.prototype.initialize.apply(this, arguments);
		},

		parse: function( data ){
			// data arrives in a sub-object with the URL as the key
			var model = {};
			// - pick the first element regardless of key
			for(var key in data ){
				model = data[key];
				break; // "break" because this is a loop
			}
			data = model;
			return data;
		}

	});

	// Collections

	// - Main Constructor
	var Collection = Backbone.Collection.extend({
		// available options
		options : {
			access_token : false
		},
		fetch : function(method, model, options) {
			var self = this;

			if( this.getToken() ){
				// we'll be using the supplied access token
				Backbone.Collection.prototype.fetch.call( self );
			} else {
				FB.getLoginStatus(function(response){
					if( response.status == "connected" ){
						// save token
						token.set( response.authResponse );
						// continue with request
						Backbone.Collection.prototype.fetch.call( self );
					}
					// else try to FB.Login?
				});
			}
		},
		sync : Sync,
		parse : function( response ){
			//console.log("facebook data:", response );
			//is uid always the id? apparently...
			var data = _.map(response, function( result ){
				if( result.uid ){
					result.id = result.uid;
					delete result.uid;
				}
				return result;
			});
			return data;
		},
		getToken: getToken
	});


	//
	Backbone.API.Facebook.Collections.Friends = Collection.extend({
		model : Backbone.API.Facebook.Models.User,
		url: function(){
			return {
				method: 'fql.query',
				query: 'Select name, uid from user where is_app_user = 1 and uid in (select uid2 from friend where uid1 = me()) order by concat(first_name,last_name) asc'
			}
		},
		initialize: function( model, options){
			// auto-fetch if requested...
			if( options.fetch ){
				this.fetch();
			}
		}
	});

	Backbone.API.Facebook.Collections.Feed = Collection.extend({
		// examples options:
		options: {
			//access_token : config.facebook.access_token
		},
		model : Backbone.API.Facebook.Models.Feed,
		url: function(){
			// creating an object of parameters
			var params = {
				method: 'fql.query',
				query: "select message,description,attachment,created_time from stream where source_id ='"+ this.id +"' limit "+ this.num,
			}
			// add access token if available
			if( this.options.access_token ){
				// we'll be using the supplied access token
				params["access_token"] = this.options.access_token;
			}
			return params;
			// old...
			// check if there is either an id or user set - fallback to 'me'
			//var page = this.user || this.id || "me";
			//return "/"+ page +"/feed?limit="+ this.num;
		},
		initialize: function( model, options){
			// parameters
			this.id = options.id || false;
			this.user = options.user || null;
			this.num = options.num || 10;
			// auto-fetch if requested...
			if( options.fetch ){
				this.fetch();
			}
		}
	});


	// Views

	// - Main Constructor
	var View = Backbone.View.extend({
		template : FB.ui,
		initialize: function( options ){
			if( options.callback ) this.callback = options.callback;
			// load the parent?
			//
			return this;
		},
		render : function(){

			this.template( this.model.toJSON(), this.callback );

		},
		callback : function(){

		}
	});

	//
	Backbone.API.Facebook.Views.Post = View.extend({
		callback : function(response) {
			//document.getElementById('msg').innerHTML = "Post ID: " + response['post_id'];
		}
	});

	Backbone.API.Facebook.Views.Login = View.extend({
		callback : function (response) {
			if( typeof( response ) != "undefined") {
				if(response.session) {
					//var user = JSON.parse(response.session);
					// save the userid in the form
					//$("#entry-form").find("input[name='fbid']").val(user.uid);
					//top.location.href = tab.link;
				} else {
					// No session
					//top.location.href = tab.host;
				}
			} else {
				// denied access
				top.location.href = tab.host;
			}
		}
	});

	Backbone.API.Facebook.Views.AddToPage = View;



// Internal
// - internal access token
// Note: Always ask for the user_likes permission before calling any of the above to make sure you get a correct result
var Token = Backbone.Model.extend({
});
// - isFan method
// Note: Always ask for the user_likes permission before calling any of the above to make sure you get a correct result
var isFan = Model.extend({
	url :  function(){
		// alternate 'plain' url
		// "/"+ this.options.uid +"/likes/"+ this.options.id
		return {
			method: 'fql.query',
			query: 'select uid from page_fan where uid='+ this.options.uid +' and page_id='+ this.options.id
		}
	},
	parse: function( response ){
		// check if there is a data response
		return { fan : !(_.isEmpty(response.data) ) };
	}

});

// init token
var token = new Token();

// Shortcut
if(typeof window.Facebook == "undefined"){
	window.Facebook = Backbone.API.Facebook;
}

})(this._, this.Backbone);