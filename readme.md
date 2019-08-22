  # Seguir - Backend for a social network

Archiving, as no longer in active use, and will no longer be maintained.

[Pronounced: seh-geer]

This is a pure API for a simple social network, it contains the following concepts:

```
User -> Follow -> User
User <- Friend -> User
User -> Like -> Item
User -> Post
```

Any actions taken by a user are posted into a newsfeed for themselves and their followers. Friends can see posts and other actions that are marked as private.

The expected flow between your application and Seguir is:

1. Application authenticates user
2. Application checks if user already has Seguir ID stored against profile
3. IF NOT: Add user to Seguir, store new Seguir ID against their profile, along with a username an 'alternate' ID and any user data
4. Use Seguir ID in all requests to API (this is the first parameter in all client APIs), or use the alternate ID or username (with a small performance hit due to the lookup)

You can see this flow with the sample application (uses Passport for authentication):  [https://github.com/cliftonc/seguir-example-application](https://github.com/cliftonc/seguir-example-application).

This approach allows users to modify any of their metadata (username, display name, email) without impacting their social graph in any way - Seguir is not opinionated about how your App defines a user.  However, you can store data against the User record in Seguir, purely as a cache, so that this information is returned in the API to avoid N calls back to your database when rendering a news feed.

If you allow anonymous access, then you simply pass null in as the first parameter (e.g. not logged in).

## Groups and its members

When a post is created by a user, then it appears in
1. feed of the user
2. feed of users who follows the user
3. feed of every groups which the user is a member of

when a post is created in the context of a group, then it appears in
1. feed of the user
2. feed of the group
3. feed of the every members of the group

## Running the Server

You need Cassandra or Postgres to be installed for the server to work, then do the following:

```bash
git clone git@github.com:tes/seguir.git
cd seguir
npm install
```

To have cassandra and postgres run for you, you can use docker-compose:

```
docker-compose up
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
  host: 'http://localhost:3000',
  appid: '74c1fb26-461f-45b1-b730-526b2fedc423',
  appsecret: 'a7c7780e546e11b3fe3c211b7576ae1d1aeed0e761e0b01d2006db408a27b8b9'
});
```

Then, within the context of a request (assuming that you are using Seguir within an application, and have middleware that retrieves the seguir ID for the current logged in user and assigns that to req.user.seguirId).

```js
app.get('/user/:username/feed', function (req, res, next) {

  // Retrieve the specified :username profile from *your* db
  db.getUserProfile(req.params.username, function (err, profile) {

    // Get the seguir ID's for both logged in user and user requested
    var loggedInUserId = req.user.seguirId;
    var userId = profile.seguirId;

    // Now, get the first 50 items
    seguir.getFeed(loggedInUserId, userId, null, 50, function (err, feed) {

      // Render it
      res.render('newsfeed', feed);

    });

  });

});

```

You can see this flow with the sample application (uses Passport for authentication):  [https://github.com/cliftonc/seguir-example-application](https://github.com/cliftonc/seguir-example-application).

## Running a Worker

You can defer costly newsfeed updates (fanouts to followers) to a worker process.  To do this, you need to do two things.  First is add config for the messaging (via Redis) to the configuration.  If you do NOT have this section, it will just process these jobs in context of the current process - if you add it, it will expect a worker to be up and listening.

https://github.com/tes/seguir/blob/master/server/config/cassandra.json#L8

```json
{
  "logging": true,
  "port":3000,
  "keyspace":"seguir",
  "cassandra": {
    "contactPoints": ["127.0.0.1"]
  },
  "messaging": {
    "host": "127.0.0.1",
    "port": 6379
  }
}
```

Now, you can either instantiate a worker programmatically with this config (e.g. like in the example application), or just start the worker:

```bash
node server/worker
```

It works by using a FIFO queue built on top of a redis list via RSMQ.  For implementation details for the way the messaging drives the workers:

https://github.com/tes/seguir/blob/master/db/messaging/index.js

The actual code paths that make the shift between in process and out of process worker use:

https://github.com/tes/seguir/blob/master/api/feed/index.js#L136

## Benchmarking

You can run a simple benchmark using the script in /benchmark.

```
TIMES=1000 CONCURRENCY=5 FEED=20 node benchmark
```

This has output (as per current version):

```
Setting up keyspace in cassandra...
!! Truncating vs recreating tables ...
Initialising feed for cliftonc with two followers, and 1004 actions
Setup time (hr): 5s 854.624881ms
Starting benchmark with TIMES=1000, CONCURRENCY=10, FEED=20 ...

........................ DONE!

Response Times:
Min: 3ms
Max: 71ms
95th: 15ms
Std Dev: 4ms

Redis Cache:
Hit Ratio [user]: 99%
Hit Ratio [post]: 95%
Hit Ratio [like]: 99%
Hit Ratio [follow]: 99%

User Cache:
Hit Ratio [user]: 99%
```

If you make any major changes please re-run the benchmark and ensure you haven't impacted performance in a negative way.

## Notifications

You can notify users of things that they have missed, via the component ```seguir-notify```:

[https://github.com/tes/seguir-notify](https://github.com/tes/seguir-notify)

## Scripted Setup

You can script the creation of seguir and an application using the CLI tool, example configuration and setup files are contained in ```/config```.

```
./bin/seguir.js -s config/setup.json -c config/index.js
```

## Debugging

Use debug environment variables to see what is going on:

```
DEBUG=seguir:* npm test
```

Options are:

```
seguir:client
seguir:server
seguir:cassandra
seguir:postgres
seguir:auth
seguir:feed
seguir:user
```

## Contributing & Developing

Test coverage is slowly increasing, intention is to get it to 100 and then pin pre-commit hooks to it.

I'm always looking for people to help out, regardless of what you think you can contribute - please reach out, and for high level contribution guidelines please read:

[Contribution Guide](https://github.com/tes/seguir/blob/master/CONTRIBUTING.md)

### Docs

```shell
npm run docs
```

This will create API documents in /docs.

```shell
git subtree push --prefix doc origin gh-pages
```

This will push any documentation changes to gh-pages.

### Future Functionality / Roadmap

* Private messaging between friends ?
* Circles vs Friends / tighter privacy controls
* Notification framework (e.g. push and email) - separate application

## Requires

This uses Node, Restify for the API server with Cassandra as a backend, and if using background workers requires Redis to manage the worker scheduling.

### Production Use

Seguir is in use in production at https://www.tes.com, create an account and take a look.
