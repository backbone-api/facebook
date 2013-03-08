// Assuming that Facebook JS lib is loaded...
(function(_, Backbone) {
	
	// Fallbacks
	//APP = window.APP || (APP = { Models: {}, Collections: {}, Views: {} });
	if( _.isUndefined(Backbone.API) ) Backbone.API = {};
	
	// Main Constructor
	Backbone.API.Facebook = Backbone.Collection.extend({
		// available options
		options : {
			access_token : false
		}, 
		fetch : function(method, model, options) {
			var self = this;
			
			if( this.options.access_token ){ 
				// we'll be using the supplied access token
				Backbone.Collection.prototype.fetch.call( self );
			} else {
				FB.getLoginStatus(function(response){
					if( response.status == "connected" ){
						// continue with request
						Backbone.Collection.prototype.fetch.call( self );
					}
					// else try to FB.Login?
				});
			}
		}, 
		sync : function(method, model, options) {
			
			var url = (this.url instanceof Function) ? this.url() : this.url;
			var params = {};
			// add access token if available
			if( this.options.access_token ){ 
				params["access_token"] =  this.options.access_token;
			}
			
			//FB.api(url, method, params, function( response ) {
			FB.api(url, function( response ) {
				// save response.paging for later?
				// send just the response.data:
				var data = response.data || response;
				options.success( data );
			});
			
		},
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
		}
	});
	
	
	// Namespace definition
	Backbone.API.Facebook.Models = {};
	Backbone.API.Facebook.Collections = {};
	Backbone.API.Facebook.Views = {};
	
	
	// Models
	Backbone.API.Facebook.Models.User = Backbone.Model.extend({
		defaults : {
			//installed : true
		}
	});
	
	Backbone.API.Facebook.Models.Feed = Backbone.Model.extend({
		defaults : {
			//installed : true
		}
	});
	
	Backbone.API.Facebook.Models.Me = Backbone.API.Facebook.Models.User.extend({
		url : "/me",
		defaults : { 
			id : "me" 
		}
	});
	
	
	// Collections
	Backbone.API.Facebook.Collections.Friends = Backbone.API.Facebook.extend({
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

	Backbone.API.Facebook.Collections.Feed = Backbone.API.Facebook.extend({
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
	
// Shortcut
if(typeof window.Facebook == "undefined"){
	window.Facebook = Backbone.API.Facebook;
}
	
})(this._, this.Backbone);