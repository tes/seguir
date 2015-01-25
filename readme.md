# Seguir - Backend for a social network

[![Documentation](https://img.shields.io/badge/documentation-apidocs-green.svg)](http://cliftonc.github.io/seguir/) [![Build Status](https://travis-ci.org/cliftonc/seguir.svg?style=flat)](https://travis-ci.org/cliftonc/seguir)

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

This approach allows users to modify any of their metadata (username, display name, email) without impacting their social graph in any way - Seguir is not opinionated about how your App defines a user.  However, you can store data against the User record in Seguir, purely as a cache, so that this information is returned in the API to avoid N calls back to your database when rendering a news feed.

If you allow anonymous access, then you simply pass null in as the first parameter (e.g. not logged in).

## Running the Server

You need Cassandra for the server:

```shell
git clone git@github.com:cliftonc/seguir.git
cd seguir
npm install
node server
```

## Running an Example Client Application

You need MongoDB for the example client application (will remove this dependency in time!):

```
git clone git@github.com:cliftonc/seguir-example-application.git
cd seguir-example-application
npm install
node server
```

Then browse to [http://localhost:4000](http://localhost:4000).

## Setup Cassandra and Sample Data

To create the Cassandra schema, note that this will **DROP** all tables in the schema first!

```shell
node setup
```

To create some sample data to work against, this will **TRUNCATE** all tables in the schema before loading!

```shell
node setup/sample-data
```

## Integrating the Client

Seguir ships with a client, that lets you point it at a seguir server and will handle things like the
authorisation, passing of current user and other configuration.  Will split client out into a separate project once it is a little more stable.

```js
var Seguir = require('seguir/client');
seguir = new Seguir({
  host:'http://localhost:3000',
  appName:'my-amazing-social-app',
  appToken:'b90d442f-8473-4d50-84f2-d8bf0a25f514'
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

## Developing

Test coverage is slowly increasing, intention is to get it to 100 and then pin pre-commit hooks to it.

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

* User object should allow for arbitrary data to be added.
* Friend should be a request, reciprocal when accepted
* Private messaging between friends
* Un-follow, and cleaning newsfeed
* Un-like, and cleaning newsfeed
* Delete post, and cleaning newsfeed
* Configuration externalised properly

## Requires

This uses Node, Restify for the API server with Cassandra as a backend.
