
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

