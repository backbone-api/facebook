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

Most Bakcbone.js conventions will apply...

```
var friends = new Facebook.Collections.Friends();

var me = new Facebook.Models.Me();
```

Facebook's UI is treated as the template method for  the Views

```
var post = new Facebook.Models.Post();
var view = new Facebook.Views.Post({ model : post, callback : MyFunction });
```


## Credits

Created by Makis Tracend ( [@tracend](http://github.com/tracend) )

Login/logout inspired by [facebook-user.js](https://github.com/fabrik42/facebook-user.js) - Copyright (c) 2010 Christian Bäuerlein

Originally used for [havenbase.com](http://havenbase.com)

Distributed through [Makesites.org](http://makesites.org)

Released under the [MIT license](http://makesites.org/licenses/MIT)

