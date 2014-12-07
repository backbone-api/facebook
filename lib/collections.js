
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

