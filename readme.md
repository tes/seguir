# Seguir - Backend for a social network

[http://cliftonc.github.io/seguir/server](http://cliftonc.github.io/seguir)

[Pronounced: seh-geer]

[![Server API](https://img.shields.io/badge/documentation-apidocs-green.svg)](http://cliftonc.github.io/seguir/server) [![Client API](https://img.shields.io/badge/documentation-apidocs-green.svg)](http://cliftonc.github.io/seguir/client) [![Build Status](https://travis-ci.org/cliftonc/seguir.svg?style=flat)](https://travis-ci.org/cliftonc/seguir) [![bitHound Score](https://www.bithound.io/cliftonc/seguir/badges/score.svg?)](https://www.bithound.io/cliftonc/seguir)

This is a pure API for a simple social network, it contains the following concepts:

```
User -> Follow -> User
User <- Friend -> User
User -> Like -> Item
User -> Post
```

Any actions taken by a user are posted into a newsfeed for themselves and their followers. Friends can see posts and other actions that are marked as private.

The expected flow between your application and Seguir is:

1. Application authenticates user.
2. Application checks if user already has Seguir ID stored against profile.
3. IF NOT: Add user to Seguir, store new Seguir ID against their profile.
4. Use Seguir ID in all requests to API (this is the first parameter in all client APIs).

You can see this flow with the sample application (uses Passport for authentication):  [https://github.com/cliftonc/seguir-example-application](https://github.com/cliftonc/seguir-example-application).

This approach allows users to modify any of their metadata (username, display name, email) without impacting their social graph in any way - Seguir is not opinionated about how your App defines a user.  However, you can store data against the User record in Seguir, purely as a cache, so that this information is returned in the API to avoid N calls back to your database when rendering a news feed.

If you allow anonymous access, then you simply pass null in as the first parameter (e.g. not logged in).

## Running the Server

You need Cassandra to be installed for the server to work, then do the following:

```bash
git clone git@github.com:cliftonc/seguir.git
cd seguir
npm install
```

You now need to initialise cassandra, to do this, use the command line tool (from the installation folder):

```bash
npm run seguir
```

Select the first option in the list 'Initialise a new cassandra instance', and follow the instructions.  Note down the application token generated for your first application, as you will need to use this in the example application configuration below.

Now, you can run the server:

```bash
node server
```

## Running an Example Client Application

To run the example application:

```bash
git clone git@github.com:cliftonc/seguir-example-application.git
cd seguir-example-application
npm install
```

Now, edit the '/config/seguir.js' configuration, and use the application name and token you created above.  Now you can run the server:

```bash
node server
```

Then browse to [http://localhost:4000](http://localhost:4000).

## Integrating the Client

Seguir ships with a client, that lets you point it at a seguir server and will handle things like the
authorisation, passing of current user and other configuration.  Will split client out into a separate project once it is a little more stable.

```js
var Seguir = require('seguir/client');
seguir = new Seguir({
  host:'http://localhost:3000',
  appid:'74c1fb26-461f-45b1-b730-526b2fedc423',
  appsecret:'a7c7780e546e11b3fe3c211b7576ae1d1aeed0e761e0b01d2006db408a27b8b9'
});
```

Then, within the context of a request (assuming that you are using Seguir within an application, and have middleware that retrieves the seguir ID for the current logged in user and assigns that to req.user.seguirId).

```js
app.get('/user/:username/feed', function(req, res, next) {

  // Retrieve the specified :username profile from *your* db
  db.getUserProfile(req.params.username, function(err, profile) {

    // Get the seguir ID's for both logged in user and user requested
    var loggedInUserId = req.user.seguirId;
    var userId = profile.seguirId;

    // Now, get the first 50 items
    seguir.getFeedForUser(loggedInUserId, userId, null, 50, function(err, feed) {

      // Render it
      res.render('newsfeed', feed);

    });

  });

});

```

You can see this flow with the sample application (uses Passport for authentication):  [https://github.com/cliftonc/seguir-example-application](https://github.com/cliftonc/seguir-example-application).

## Contributing & Developing

Test coverage is slowly increasing, intention is to get it to 100 and then pin pre-commit hooks to it.

I'm always looking for people to help out, regardless of what you think you can contribute - please reach out, and for high level contribution guidelines please read:

[Contribution Guide](https://github.com/cliftonc/seguir/blob/master/CONTRIBUTING.md)

### Docs

```shell
npm run docs
```

This will create API documents in /docs.

```shell
git subtree push --prefix doc origin gh-pages
```

This will push any documentation changes to gh-pages.

## Todo

### API

* Tidy up API to make consistent re. logged in user
* Move some newsfeed work into background worker - use job queue

### Functionality

* Private messaging between friends
* Un-like, and cleaning newsfeed
* Delete post, and cleaning newsfeed


## Requires

This uses Node, Restify for the API server with Cassandra as a backend.
