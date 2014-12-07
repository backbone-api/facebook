/**
 * @name backbone.api.facebook
 * Backbone API: Facebook
 *
 * Version: 0.7.0 (Sun, 07 Dec 2014 08:37:36 GMT)
 * Source: http://github.com/backbone-api/facebook
 *
 * @author makesites
 * Initiated by: Makis Tracend (@tracend)
 * Distributed through [Makesites.org](http://makesites.org)
 *
 * @cc_on Copyright © Makesites.org
 * @license Released under the MIT
 */


(function (lib) {

	//"use strict";

	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		var deps = ['jquery', 'underscore', 'backbone']; // condition when backbone.app is part of the array?
		define(deps, lib);
	} else if ( typeof module === "object" && module && typeof module.exports === "object" ){
		// Expose as module.exports in loaders that implement CommonJS module pattern.
		module.exports = lib;
	} else {
		// Browser globals
		var Query = window.jQuery || window.Zepto || window.vQuery;
		lib(Query, window._, window.Backbone, window.APP);
	}
}(function ($, _, Backbone, APP) {

	// support for Backbone APP() view if available...
	var isAPP = ( typeof APP !== "undefined");
	//var View = ( isAPP  && typeof APP.View !== "undefined" ) ? APP.View : Backbone.View;


	// Assuming that Facebook JS lib is loaded...
	//if( window.FB )

	// Constants
	var api = "https://graph.facebook.com";

	// Base model - mainly used for setup options
	var Facebook = new Backbone.Model({
		api: api,
		appId: false,
		uri: false
	});

	// Namespace definition
	Facebook.Models = {};
	Facebook.Collections = {};
	Facebook.Views = {};




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

	// normalize method
	var rest = { "read" : "get", "create": "post", "update": "put", "delete": "delete" };

	//FB.api(url, method, params, function( response ) {
	FB.api(url, rest[method], function( response ) {
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

// Models

// - Main Constructor
var Model = Backbone.Model.extend({
	// available options
	options : {
		access_token : false
	},

	initialize: function(model, options){
		// fallbacks
		options = options || {};
		this.options = _.extend(this.options, options);
		//return Backbone.Model.prototype.initialize.apply(this, arguments);
		// auto-fetch if requested...
		if( options.fetch ){
			this.fetch();
		}
	},

	fetch : function(method, model, options) {
		var self = this;

		if( this.getToken() ){
			// we'll be using the supplied access token
			Backbone.Model.prototype.fetch.call( self, method, model, options );
		} else if( !this.options.auth ){
			// this endpoint doesn't require login
			Backbone.Model.prototype.fetch.call( self, method, model, options );
		} else {
			FB.getLoginStatus(function(response){
				if( response.status == "connected" ){
					// save token
					token.set( response.authResponse );
					// continue with request
					Backbone.Model.prototype.fetch.call( self, method, model, options );
				}
				// else try to FB.Login?
			});
		}
	},
	sync: Sync,
	getToken: getToken
});

//
Facebook.Models.User = Model.extend({
	url : function(){ return Facebook.get("api") + "/"+ this.get("id"); },
	options: {
		auth: false
	},
	defaults : {
		id: 0
		//installed : true
	}
});

Facebook.Models.Feed = Model.extend({
	defaults : {}
});

Facebook.Models.Post = Model.extend({
	defaults : {
		method: "feed",
		link: "",
		picture: "",
		name: "",
		caption: "",
		description: ""
	}
});

Facebook.Models.Page = Model.extend({
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

Facebook.Models.Tab = Model.extend({
	url: function(){ return Facebook.get("api") + "/"+ this.page +"/tabs/app_"+ this.id; },
	defaults : {},
	initialize: function( data, options ){
		this.page = data.page;
		this.id = Facebook.get("appId");
	}
});


//
Facebook.Models.Link = Model.extend({
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
		};
	},

	parse: function( response ){
		// error control?
		if( response instanceof Array ){
			// use only the first item
			return response.shift();
		} else {
			return response;
		}
	}
});

Facebook.Models.Login = Model.extend({
	defaults : {
		method: "oauth",
		client_id: false //fb_appId
		//display: "popup",
		//response_type: "token"
		//redirect_uri: "" //https://apps.facebook.com/'+ fb_uri +'/'
	}
});

Facebook.Models.AddToPage = Model.extend({
	defaults : {
		method: 'pagetab'
		//redirect_uri: '', //https://apps.facebook.com/{{fb_uri}}/
	}
});

// Me is an extension of the user
Facebook.Models.Me = Facebook.Models.User.extend({
	defaults : {
		id : "me"
	},
	// defaultOptions: {
	options : {
		auth: false,
		// see https://developers.facebook.com/docs/authentication/permissions/
		scope: [], // fb permissions
		autosync: true, // auto fetch profile after login
		protocol: location.protocol
	},
	oauth: null,
	initialize: function(){
		var self = this;
		FB.Event.subscribe('auth.authResponseChange', function(e){ self.onLoginStatusChange(e); });
		return Backbone.API.Facebook.Models.User.prototype.initialize.apply(this, arguments);
	},

	login: function(callback){
		callback =  callback || function() {};
		FB.login(callback, { scope: this.options.scope.join(',') });
	},

	logout: function(){
		FB.logout();
	},

	onLoginStatusChange: function(response) {
		// only execute once?
		if(this.options.auth === response.status) return false;

		var event;

		if(response.status === 'not_authorized') {
			event = 'facebook:unauthorized';
			// login logic
		} else if (response.status === 'connected') {
			event = 'facebook:connected';
			// save request for later...
			this.request = FB.getAuthResponse();
			// copy access token
			this.oauth = {
				access_token : this.request.accessToken,
				expiry : (new Date()).getTime() + this.request.expiresIn
			};
			if(this.options.autosync === true) this.fetch();
		} else {
			event = 'facebook:disconnected';
		}

		this.trigger(event, this, response);
		this.options.auth = response.status;
	}

});

Facebook.Models.WebPage = Model.extend({

	defaults : {
		"shares": 0,
		"comments": 0,
		"type": "website",
		"is_scraped": false
	},

	options: {

	},

	url: function(){ return Facebook.get("api") +"/?ids="+ this.options.page; },

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
		};
	},
	parse: function( response ){
		// check if there is a data response
		return { fan : !(_.isEmpty(response.data) ) };
	}

});


// Collections

// - Main Constructor
var Collection = Backbone.Collection.extend({
	// available options
	options : {
		access_token : false
	},

	initialize: function(model, options){
		// fallbacks
		options = options || {};
		this.options = _.extend(this.options, options);
		//return Backbone.Collection.prototype.initialize.apply(this, arguments);
		// auto-fetch if requested...
		if( options.fetch ){
				this.fetch();
		}
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
Facebook.Collections.Friends = Collection.extend({
	model: Facebook.Models.User,
	url: function(){
		return {
			method: 'fql.query',
			query: 'Select name, uid from user where is_app_user = 1 and uid in (select uid2 from friend where uid1 = me()) order by concat(first_name,last_name) asc'
		};
	}
});

Facebook.Collections.Feed = Collection.extend({
	// examples options:
	options: {
		//access_token : config.facebook.access_token
	},
	model: Facebook.Models.Feed,
	url: function(){
		// creating an object of parameters
		var params = {
			method: 'fql.query',
			query: "select message,description,attachment,created_time from stream where source_id ='"+ this.id +"' limit "+ this.num
		};
		// add access token if available
		if( this.options.access_token ){
			// we'll be using the supplied access token
			params.access_token = this.options.access_token;
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
		// fallback
		options = options || {};

		if( options.callback ) this.callback = options.callback;
		// load the parent?
		//
		// fincally, render the view
		return this.render();
	},
	render : function(){

		this.template( this.model.toJSON(), this.callback );
		// preserve chainability?
		return this;

	},
	callback : function(){

	}
});

//
Facebook.Views.Post = View.extend({
	callback : function(response) {
		//document.getElementById('msg').innerHTML = "Post ID: " + response['post_id'];
	}
});

Facebook.Views.Login = View.extend({
	initialize: function( options ){
		//
		this.model = new Backbone.API.Facebook.Models.Login({
			client_id: Backbone.API.Facebook.get("appId") //fb_appId
			//redirect_uri: "https://apps.facebook.com/"+ Backbone.API.Facebook.get("uri") +'/'
		});
		// load the parent?
		//
		return View.prototype.initialize.call( this, options );
	},
	callback : function (response) {
		if( typeof( response ) != "undefined") {
			if(response.session) {
				//var user = JSON.parse(response.session);
				// save the userid in the form
				//$("#entry-form").find("input[name='fbid']").val(user.uid);
				top.location.href = this.model.get("redirect_uri");
			} else {
				// No session
				//top.location.href = 'http://facebook.com/';
				console.log("no session");
				window.location.reload();
			}
		} else {
			// denied access
			console.log("denied access");
			//top.location.href = tab.host;
		}
	}
});

Facebook.Views.AddToPage = View.extend({
	initialize: function( options ){
		//
		this.model = new Backbone.API.Facebook.Models.AddToPage();
		// load the parent?
		//
		return View.prototype.initialize.call( this, options );
	}
});





	// init token
	var token = new Token();

	// update Backbone namespace regardless
	Backbone.API = Backbone.API || {};
	Backbone.API.Facebook = Facebook;
	if( isAPP ){
		APP.API = APP.API || {};
		APP.API.Facebook = Facebook;
	}

	// If there is a window object, that at least has a document property
	if ( typeof window === "object" && typeof window.document === "object" ) {
		window.Backbone = Backbone;
		// update APP namespace
		if( isAPP ){
			window.APP = APP;
		}
		// optionally extend the global namespace with shortcode
		if( !window.Facebook ) window.Facebook = Facebook;
	}

	// for module loaders:
	return Facebook;

}));
