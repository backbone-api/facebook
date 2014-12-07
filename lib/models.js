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
