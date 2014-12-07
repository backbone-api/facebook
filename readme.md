# Backbone API : Facebook

A simple way to interact with Facebook's Graph API using Backbone.js objects.

## Install

```
bower install backbone.api.facebook
```
## Dependencies

* Facebook JS: [all](http://connect.facebook.net/en_US/all.js)

## Usage

The plugin will try to create a global namespace ```Facebook``` that will host all the Models/Views/Collections mirrored from Backbone.API.Facebook

When the web page is loaded, passing the ```appId``` and ```uri``` for reference in the api requests

```
Facebook.set({
	appId: 345644234546,
	uri: "namespace"
});
```

Common Backbone.js conventions apply using the _Facebook_ namespace.

```
var friends = new Facebook.Collections.Friends();

var me = new Facebook.Models.Me();
```

Facebook's UI is treated as the template method for the Views

```
var post = new Facebook.Models.Post();
var view = new Facebook.Views.Post({ model : post, callback : MyFunction });
```


## Credits

Initiated by Makis Tracend ( [@tracend](http://github.com/tracend) )

Distributed through [Makesites.org](http://makesites.org)

### Trivia

* Login/logout inspired by [facebook-user.js](https://github.com/fabrik42/facebook-user.js) - Copyright (c) 2010 Christian Bäuerlein
* Originally used for [havenbase.com](http://havenbase.com)


### License

Released under the [MIT license](http://makesites.org/licenses/MIT)
