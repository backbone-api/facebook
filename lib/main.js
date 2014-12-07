/**
 * @name {{name}}
 * {{description}}
 *
 * Version: {{version}} ({{build_date}})
 * Source: {{repository}}
 *
 * @author {{author}}
 * Initiated by: Makis Tracend (@tracend)
 * Distributed through [Makesites.org](http://makesites.org)
 *
 * @cc_on Copyright © Makesites.org
 * @license Released under the {{license licenses}}
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



{{{lib}}}



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
