# Seguir - Backend for a social network

[![Build Status](https://travis-ci.org/cliftonc/seguir.svg)](https://travis-ci.org/cliftonc/seguir)

This is a pure API for a simple social network, it contains the following concepts:

```
User -> Follow -> User
User -> Friend -> User
User -> Like -> Item
User -> Post
```

Any actions taken by a user are posted into a newsfeed for themselves and their followers.  It is expected that the application using this API authenticates users, and just passes a shared key for each user through to seguir.

## Todo

* Un-follow, and cleaning newsfeed
* Un-like, and cleaning newsfeed
* Delete post, and cleaning newsfeed
* Application token based restful API

## Requires

This uses Cassandra as a backend.
