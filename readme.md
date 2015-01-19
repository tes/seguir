# Seguir - Backend for a social network

[![Documentation](https://img.shields.io/badge/documentation-apidocs-green.svg)](http://cliftonc.github.io/seguir/) [![Build Status](https://travis-ci.org/cliftonc/seguir.svg?style=flat)](https://travis-ci.org/cliftonc/seguir)

This is a pure API for a simple social network, it contains the following concepts:

```
User -> Follow -> User
User <- Friend -> User
User -> Like -> Item
User -> Post
```

Any actions taken by a user are posted into a newsfeed for themselves and their followers.  It is expected that the application using this API authenticates users, and just passes a shared key for each user through to seguir.

The friend concept will be used to allow private messaging and control visibility of your newsfeed to others.

## Running

```
git clone git@github.com:cliftonc/seguir.git
cd seguir
npm install
node server
```

## Docs

```
npm run docs
```

This will create API documents in /docs.

```
git subtree push --prefix doc origin gh-pages
```

This will push any documentation changes to gh-pages.

## Developing

Test coverage is slowly increasing, intention is to get it to 100 and then pin pre-commit hooks to it.

## Todo

* User probably needs shared key other than username, along with avatar
* Friend should be a request, reciprocal when accepted
* Private messaging between friends
* Un-follow, and cleaning newsfeed
* Un-like, and cleaning newsfeed
* Delete post, and cleaning newsfeed

## Requires

This uses Node, Restify for the API server with Cassandra as a backend.
