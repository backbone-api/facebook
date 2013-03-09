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
	
	
	// Models
	
	// - Main Constructor
	var Model = Backbone.Model.extend({
		
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
	
	Backbone.API.Facebook.Models.Login = Model.extend({
		defaults : {
			method: "oauth", 
			client_id: false, 
			redirect_uri: ""
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
	
	
// Helpers

// Internal isFan method
var isFan = new Model.extend({
	url :  function(){
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
		
	
// Shortcut
if(typeof window.Facebook == "undefined"){
	window.Facebook = Backbone.API.Facebook;
}
	
})(this._, this.Backbone);