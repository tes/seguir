define({ "api": [
  {
    "type": "config",
    "url": "Options",
    "title": "Options",
    "name": "ClientOptions",
    "group": "Client",
    "version": "1.0.0",
    "description": "<p>Default configuration</p> ",
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ isFriend: false,\n       isFriendSince: null,\n       isFriendRequestPending: false,\n       isFriendRequestSince: null,\n       youFollow: true,\n       youFollowSince: '2015-02-02T06:45:55.459Z',\n       theyFollow: false,\n       theyFollowSince: null,\n       inCommon:\n        [ { user: '67528c2a-dd02-45a1-bc00-e240697a2256',\n            username: 'ted'} ] }",
          "type": "json"
        }
      ]
    },
    "filename": "client/index.js",
    "groupTitle": "Seguir Client",
    "groupDescription": "<p>The Seguir client provides a simple and consistent API for interacting with a seguir client without having to worry about authentication or passing the logged in user details.</p> "
  }
] });