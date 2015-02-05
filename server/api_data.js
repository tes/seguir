define({ "api": [
  {
    "type": "get",
    "url": "/feed/:user",
    "title": "Get a feed for a user",
    "name": "GetFeed",
    "group": "ApiFeeds",
    "version": "1.0.0",
    "description": "<p>Retrieves a set of feed items for a specific user</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the guid of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n     [\n       {\n           \"post\": \"247455fe-0e8e-4e3f-af4d-458ac13508b8\",\n           \"content\": \"HELLO WORLD!\",\n           \"user\": {\n               \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n               \"username\": \"cliftonc\"\n           },\n           \"posted\": \"2015-01-18T20:37:32.626Z\",\n           \"type\": \"post\",\n           \"timeuuid\": \"d4065671-9f51-11e4-889d-9f08914a01c0\",\n           \"date\": \"2015-01-18T20:37:32.631Z\",\n           \"fromNow\": \"a few seconds ago\",\n           \"fromFollow\": false,\n           \"isLike\": false,\n           \"isPost\": true,\n           \"isFollow\": false,\n           \"isFriend\": false\n       },\n       {\n         \"friend\": \"7b3891d8-cc27-4284-8fb4-d3b455186f99\",\n         \"user\": {\n             \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n             \"username\": \"cliftonc\"\n         },\n         \"user_friend\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n         \"since\": \"2015-01-18T20:36:38.632Z\",\n         \"username_friend\": \"cliftonc\",\n         \"type\": \"friend\",\n         \"timeuuid\": \"b3d781d0-9f51-11e4-889d-9f08914a01c0\",\n         \"date\": \"2015-01-18T20:36:38.637Z\",\n         \"fromNow\": \"5 minutes ago\",\n         \"fromFollow\": false,\n         \"isLike\": false,\n         \"isPost\": false,\n         \"isFollow\": false,\n         \"isFriend\": true\n     }\n     ]",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Feeds",
    "groupDescription": "<p>This is a collection of methods that allow you to retrieve the news feed for a user.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/follow",
    "title": "Add a follower to a user",
    "name": "AddFollower",
    "group": "ApiFollowers",
    "version": "1.0.0",
    "description": "<p>Adds a new friend to a user account.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>the guid representation of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user_follower",
            "description": "<p>the guid of the user to become friends with</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n     {\n         \"follow\": \"b90d442f-8473-4d50-84f2-d8bf0a25f514\",\n         \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n         \"user_follower\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n         \"timestamp\": 1421663431703\n     }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Followers",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve follows.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a username</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a username.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a follow guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/followers/:follow",
    "title": "Get follow details",
    "name": "GetFollower",
    "group": "ApiFollowers",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific follow</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "follow",
            "description": "<p>the guid of a specific follow</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n         {\n             \"user_follower\": {\n                 \"user\": \"379554e7-72b0-4009-b558-aa2804877595\",\n                 \"username\": \"Mabel.Sporer\"\n             },\n             \"since\": \"1993-11-19T00:58:16.000Z\"\n         },\n         {\n             \"user_follower\": {\n                 \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n                 \"username\": \"cliftonc\"\n             },\n             \"since\": \"2015-01-18T20:37:09.383Z\"\n         }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Followers",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve follows.</p> ",
    "error": {
      "fields": {
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/user/:user/followers",
    "title": "Get followers for a user",
    "name": "GetFollowers",
    "group": "ApiFollowers",
    "version": "1.0.0",
    "description": "<p>Retrieves a set of feed items for a specific user</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>the username of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n[\n         {\n             \"user_follower\": {\n                 \"user\": \"379554e7-72b0-4009-b558-aa2804877595\",\n                 \"username\": \"Mabel.Sporer\"\n             },\n             \"since\": \"1993-11-19T00:58:16.000Z\"\n         },\n         {\n             \"user_follower\": {\n                 \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n                 \"username\": \"cliftonc\"\n             },\n             \"since\": \"2015-01-18T20:37:09.383Z\"\n         }\n     ]",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Followers",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve follows.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "delete",
    "url": "/user/:user/follower/:user_follower",
    "title": "Stop following a user.",
    "name": "RemoveFollower",
    "group": "ApiFollowers",
    "version": "1.0.0",
    "description": "<p>Removes a follow</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the user guid</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_follower",
            "description": "<p>the user who will stop following the first user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n    {\n       \"status\":\"removed\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Followers",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve follows.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a guid for the user</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a user guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a follow guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/friend-request/accept",
    "title": "Accept a friend request",
    "name": "AcceptFriendRequest",
    "group": "ApiFriendRequests",
    "version": "1.0.0",
    "description": "<p>Accepts a friend request.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "friend_request",
            "description": "<p>the guid of the user to become friends with</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ friend: '2334694d-21a6-42b1-809e-79175654dcd9',\n       reciprocal: '90068d45-efc1-4e86-807d-a9ba1c8d794a',\n       user: '17b4794d-0ec9-4005-a299-13e40dedf670',\n       user_friend: 'cba56b9b-de75-4ed5-8a1b-1a152c016ed7',\n       timestamp: 1422292521727 }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friend Requests",
    "groupDescription": "<p>This is a collection of methods that allow you to use the friend request workflow (instead of creating friends automatically).</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a guid for the user</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a user guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a friend guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/friend-request",
    "title": "Submit a new friend request",
    "name": "AddFriendRequest",
    "group": "ApiFriendRequests",
    "version": "1.0.0",
    "description": "<p>Adds a new friend request.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_friend",
            "description": "<p>the guid of the user to become friends with</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>the message to leave</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n    {\n       \"friend_request\": \"28104896-2e8d-4ba1-9e13-14dd0f096277\",\n       \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n       \"user_friend\": \"379554e7-72b0-4009-b558-aa2804877595\",\n       \"message\": \"Please be my friend!\",\n       \"timestamp\": 1421650920521\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friend Requests",
    "groupDescription": "<p>This is a collection of methods that allow you to use the friend request workflow (instead of creating friends automatically).</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a guid for the user</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a user guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a friend guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/friend-request/active",
    "title": "Get active friend requests",
    "name": "GetFriendRequests",
    "group": "ApiFriendRequests",
    "version": "1.0.0",
    "description": "<p>Retrieves active friend Requests for logged in user (inbound and outbound)</p> ",
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ incoming: [],\n       outgoing:\n        [ { friend_request: '648909bf-9039-4e25-8c3d-1d80e9fe3b35',\n            user: '17b4794d-0ec9-4005-a299-13e40dedf670',\n            user_friend: 'cba56b9b-de75-4ed5-8a1b-1a152c016ed7',\n            message: 'Hello world!',\n            since: '2015-01-26T17:15:21.705Z' } ] }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friend Requests",
    "groupDescription": "<p>This is a collection of methods that allow you to use the friend request workflow (instead of creating friends automatically).</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/friend",
    "title": "Add a friend to a user",
    "name": "AddFriend",
    "group": "ApiFriends",
    "version": "1.0.0",
    "description": "<p>Adds a new friend to a user account.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the guid representation of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_friend",
            "description": "<p>the guid of the user to become friends with</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n    {\n       \"friend\": \"28104896-2e8d-4ba1-9e13-14dd0f096277\",\n       \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n       \"user_friend\": \"379554e7-72b0-4009-b558-aa2804877595\",\n       \"timestamp\": 1421650920521\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friends",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve friend links.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a username</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a username.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a friend guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/friend/:friend",
    "title": "Get friend",
    "name": "GetFriend",
    "group": "ApiFriends",
    "version": "1.0.0",
    "description": "<p>Retrieves a specific relationship information</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the guid of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "  HTTP/1.1 200 OK\n[\n         {\n             \"user_friend\": {\n                 \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n                 \"username\": \"cliftonc\"\n             },\n             \"since\": \"2015-01-18T20:36:38.632Z\"\n         }\n     ]",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friends",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve friend links.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/user/:user/friends",
    "title": "Get friends for a user",
    "name": "GetFriends",
    "group": "ApiFriends",
    "version": "1.0.0",
    "description": "<p>Retrieves a set of friends for a specific user</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the guid of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "  HTTP/1.1 200 OK\n[\n         {\n             \"user_friend\": {\n                 \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n                 \"username\": \"cliftonc\"\n             },\n             \"since\": \"2015-01-18T20:36:38.632Z\"\n         }\n     ]",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friends",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve friend links.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "delete",
    "url": "/user/:user/friend/:user_friend",
    "title": "Remove a friendship.",
    "name": "RemoveFriend",
    "group": "ApiFriends",
    "version": "1.0.0",
    "description": "<p>Removes a friendship (both sides)</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>the guid representation of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user_friend",
            "description": "<p>the guid representation of the user they dont want to be friends with</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n    {\n       \"status\":\"removed\"\n    }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Friends",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve friend links.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a guid for the user</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a user guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a friend guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/like",
    "title": "Add a like by a user",
    "name": "AddLike",
    "group": "ApiLikes",
    "version": "1.0.0",
    "description": "<p>Creates a new like of an item</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl --data \"user=405d7e5e-c028-449c-abad-9c11d8569b8f&item=github.com\" http://localhost:3000/like",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>the guid representation of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "item",
            "description": "<p>a canonical url to the item liked</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',\n  'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',\n  'item': 'http://github.com',\n  'timestamp': 1421585133444 }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Likes",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve likes.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a username</p> "
          },
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a username.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide an item.\"\n}",
          "type": "json"
        },
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/user/:user/like/:item",
    "title": "Check a specific like",
    "name": "CheckLike",
    "group": "ApiLikes",
    "version": "1.0.0",
    "description": "<p>Checks if a user likes a specific item, typically the item is a canonical url.</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/like/405d7e5e-c028-449c-abad-9c11d8569b8f/github.com",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The guid of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "item",
            "description": "<p>The item to check</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',\n  'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',\n  'item': 'github.com',\n  'timestamp': 1421585133444 }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Likes",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve likes.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/like/:like",
    "title": "Get a specific like",
    "name": "GetLike",
    "group": "ApiLikes",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific like</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/like/405d7e5e-c028-449c-abad-9c11d8569b8f/github.com",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "post",
            "description": "<p>The guid of the like</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ 'like': '8a3c8e57-67a1-4874-8f34-451f59f6d153',\n  'user': '405d7e5e-c028-449c-abad-9c11d8569b8f',\n  'item': 'github.com',\n  'timestamp': 1421585133444 }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Likes",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve likes.</p> ",
    "error": {
      "fields": {
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/post",
    "title": "Add a post by a user",
    "name": "AddPost",
    "group": "ApiPosts",
    "version": "1.0.0",
    "description": "<p>Creates a new post, by default all new posts are public, and so can be seen by all users.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "content",
            "description": "<p>of the post</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "timestamp",
            "description": "<p>the time that the post occurred</p> "
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "private",
            "description": "<p>is the post private, e.g. only for friends</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ 'post': '19a8bfd1-8ebe-4462-bf93-9bd48efe08b7',\n  'user': '4be37f53-7b79-4b77-9b08-c06346f507aa',\n  'content': 'Hello, this is a post',\n  'timestamp': 1421584990835 }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Posts",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve posts.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a guid for the user</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a user guid.\"\n}",
          "type": "json"
        },
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide content for the post.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/post/:post",
    "title": "Get a specific post",
    "name": "GetPost",
    "group": "ApiPosts",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific post</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "post",
            "description": "<p>The guid of the post</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n     {\n         \"post\": \"247455fe-0e8e-4e3f-af4d-458ac13508b8\",\n         \"content\": \"HELLO WORLD!\",\n         \"user\": \"cbeab41d-2372-4017-ac50-d8d63802d452\",\n         \"posted\": \"2015-01-18T20:37:32.626Z\"\n     }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Posts",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve posts.</p> ",
    "error": {
      "fields": {
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Get a specific user by id",
    "name": "GetUser",
    "group": "ApiUsers",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific user by id</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/user/cbeab41d-2372-4017-ac50-d8d63802d452",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>The id of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n  \"user\":\"cbeab41d-2372-4017-ac50-d8d63802d452\",\n  \"username\":\"cliftonc\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Users",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve users.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/username/:username",
    "title": "Get a specific user",
    "name": "GetUser",
    "group": "ApiUsers",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific user</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/username/cliftonc",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>The name of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n  \"user\":\"cbeab41d-2372-4017-ac50-d8d63802d452\",\n  \"username\":\"cliftonc\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Users",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve users.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/user/:id/relationship",
    "title": "Get details of a relationship",
    "name": "GetUserRelationship",
    "group": "ApiUsers",
    "version": "1.0.0",
    "description": "<p>Retrieves details of a specific user relationship by id</p> ",
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost:3000/user/cbeab41d-2372-4017-ac50-d8d63802d452/relationship",
        "type": "curl"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>The id of the user</p> "
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{ isFriend: false,\n       isFriendSince: null,\n       isFriendRequestPending: false,\n       isFriendRequestSince: null,\n       youFollow: true,\n       youFollowSince: '2015-02-02T06:45:55.459Z',\n       theyFollow: false,\n       theyFollowSince: null,\n       inCommon:\n        [ { user: '67528c2a-dd02-45a1-bc00-e240697a2256',\n            username: 'ted'} ] }",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Users",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve users.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "NotFoundError",
            "description": "<p>The user was not found.</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Not-Found:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Could not find that user.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/user",
    "title": "Add a user",
    "name": "Users",
    "group": "ApiUsers",
    "version": "1.0.0",
    "description": "<p>Creates a new user.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>the name of the user</p> "
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "userdata",
            "description": "<p>arbitrary user data</p> "
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl --data \"username=cliftonc\" http://localhost:3000/user",
        "type": "curl"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "HTTP/1.1 200 OK",
          "content": "HTTP/1.1 200 OK\n{\n  \"user\":\"1b869349-d8f8-45b1-864e-19164e1b925a\",\n  \"username\": \"cliftonc\",\n  \"userdata\": {\n    \"avatar\":\"/img/123.jpg\"\n  }\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./server/index.js",
    "groupTitle": "Users",
    "groupDescription": "<p>This is a collection of methods that allow you to create and retrieve users.</p> ",
    "error": {
      "fields": {
        "4xx": [
          {
            "group": "4xx",
            "optional": false,
            "field": "BadRequestError",
            "description": "<p>You did not provide a username</p> "
          }
        ],
        "5xx": [
          {
            "group": "5xx",
            "optional": false,
            "field": "ServerError",
            "description": "<p>There was a server problem.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Bad-Request:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"code\": \"BadRequestError\",\n  \"message\": \"You must provide a username.\"\n}",
          "type": "json"
        },
        {
          "title": "Server-Error:",
          "content": "HTTP/1.1 500 Server Error\n{\n  \"code\": \"NotFoundError\",\n  \"message\": \"Something specific about the server error\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "config",
    "url": "Options",
    "title": "Options",
    "name": "ClientOptions",
    "group": "Client",
    "version": "1.0.0",
    "description": "<p>Default configuration</p> ",
    "filename": "./client/index.js",
    "groupTitle": "Seguir Client",
    "groupDescription": "<p>The Seguir client provides a simple and consistent API for interacting with a seguir client without having to worry about authentication or passing the logged in user details.</p> "
  },
  {
    "type": "table",
    "url": "Follower",
    "title": "Follower",
    "name": "FollowerData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores follower data from one user to another, this is not necessarily reciprocal, and does not require approval.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "follow",
            "description": "<p>The unique guid for the follower relationship.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user_follower",
            "description": "<p>The unique guid for the user they are following.</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "since",
            "description": "<p>The date the follow began.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Follow",
        "content": "INSERT INTO seguir.followers (follow, user, user_follower, since) VALUES(?, ?, ?, ?);",
        "type": "cql"
      },
      {
        "title": "Select Follow",
        "content": "SELECT follow, user, user_follower, since FROM seguir.followers WHERE follow = ?",
        "type": "cql"
      },
      {
        "title": "Select Followers",
        "content": "SELECT user, user_follower, since from seguir.followers WHERE user = ?",
        "type": "cql"
      },
      {
        "title": "Remove Follow",
        "content": "DELETE FROM {KEYSPACE}.followers WHERE follow = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "Friends",
    "title": "Friends",
    "name": "FriendData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores a reference to between each user and their friends, this is reciprocal so you get two rows per relationship.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "friend",
            "description": "<p>The unique guid for the friend relationship.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user_friend",
            "description": "<p>The unique guid for the user they are friends with.</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "since",
            "description": "<p>The date the relationship began.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Friend",
        "content": "INSERT INTO seguir.friends (friend, user, user_friend, since) VALUES(?, ?, ?, ?)",
        "type": "cql"
      },
      {
        "title": "Select Friend",
        "content": "SELECT friend, user, user_friend, since FROM seguir.friends WHERE friend = ?",
        "type": "cql"
      },
      {
        "title": "Select Friends",
        "content": "SELECT user_friend, since from seguir.friends WHERE user = ?",
        "type": "cql"
      },
      {
        "title": "Remove Friend",
        "content": "DELETE FROM {KEYSPACE}.friends WHERE friend = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "FriendRequests",
    "title": "Friend Requests",
    "name": "FriendRequestData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores pending friend requests, stored in a separate table to simplify the relationship management and newsfeed.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "friend_request",
            "description": "<p>The unique guid for the friend requyest.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user_friend",
            "description": "<p>The unique guid for the user they are friends with.</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>The message to send with the request</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "time",
            "description": "<p>The date the request was made.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Friend Request",
        "content": "INSERT INTO seguir.friend_request (friend_request, user, user_friend, message, time) VALUES(?, ?, ?, ?)",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "Likes",
    "title": "Likes",
    "name": "LikesData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores items that a user &#39;likes&#39; on their newsfeed, an item can be anything that is representable by a string (e.g. a canonical URL for a page is a typical example, but it can be anything);</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "like",
            "description": "<p>The unique guid for the like.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "item",
            "description": "<p>The key of the item liked by the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "since",
            "description": "<p>The date the like was made.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Like",
        "content": "INSERT INTO seguir.likes (like, user, item, since) VALUES(?, ?, ?, ?);",
        "type": "cql"
      },
      {
        "title": "Select Like",
        "content": "SELECT like, item, user, since FROM seguir.likes WHERE like = ?",
        "type": "cql"
      },
      {
        "title": "Check Like",
        "content": "SELECT like, user, since FROM seguir.likes WHERE user = ? AND item = ?",
        "type": "cql"
      },
      {
        "title": "Remove Like",
        "content": "DELETE FROM {KEYSPACE}.likes WHERE like = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "Posts",
    "title": "Posts",
    "name": "PostsData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores posts that a user (or application) make to a users timeline.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "post",
            "description": "<p>The unique guid for the post.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "content",
            "description": "<p>The content of the post.</p> "
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "isprivate",
            "description": "<p>Is the post only for friends.</p> "
          },
          {
            "group": "Parameter",
            "type": "Timestamp",
            "optional": false,
            "field": "posted",
            "description": "<p>The date the post was made.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Post",
        "content": "INSERT INTO seguir.posts (post, user, content, posted) VALUES(?, ?, ?, ?)",
        "type": "cql"
      },
      {
        "title": "Select Post",
        "content": "SELECT post, content, user, posted FROM seguir.posts WHERE post = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "Users",
    "title": "Users",
    "name": "UserData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Stores a reference to each user that can have posts, likes, friends and followers.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "username",
            "description": "<p>The name of the user.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert User",
        "content": "INSERT INTO seguir.users (user, username) VALUES(?, ?)",
        "type": "cql"
      },
      {
        "title": "Select User",
        "content": "SELECT user, username FROM seguir.users WHERE user = ?",
        "type": "cql"
      },
      {
        "title": "Select User by Name",
        "content": "SELECT user, username FROM seguir.users WHERE username = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "table",
    "url": "Userline",
    "title": "Newsfeed",
    "name": "UserLineData",
    "group": "Data",
    "version": "1.0.0",
    "description": "<p>Contains the newsfeed for each user, updated by performing any of the Add actions, not interacted with directly.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "user",
            "description": "<p>The unique guid for the user.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "time",
            "description": "<p>The unique timeuuid for the event, this is how the feed is sorted.</p> "
          },
          {
            "group": "Parameter",
            "type": "Guid",
            "optional": false,
            "field": "item",
            "description": "<p>The unique guid for the item in the feed - this can be a post, follow, friend or like event.</p> "
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>The string short name for the type of event, valid values are: &#39;post&#39;,&#39;follow&#39;,&#39;friend&#39;,&#39;like&#39;.</p> "
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "isprivate",
            "description": "<p>Is this event private and only visible if the user is a friend.</p> "
          }
        ]
      }
    },
    "filename": "./setup/setupKeyspace.js",
    "groupTitle": "Data Structure",
    "groupDescription": "<p>This section defines the various table structures used to store the data in Cassandra, as we are using apidoc to generate this documentation, please read the &#39;parameters&#39; reflects the columns in the tables.</p> ",
    "examples": [
      {
        "title": "Insert Feed Item",
        "content": "INSERT INTO seguir.userline (user, item, type, time) VALUES(?, ?, ?, ?);",
        "type": "cql"
      },
      {
        "title": "Select Feed",
        "content": "SELECT user, time, dateOf(time) AS date, item, type FROM seguir.userline WHERE user = ? {privateClause}{timeClause} LIMIT {limit}",
        "type": "cql"
      },
      {
        "title": "Remove Item from feed)",
        "content": "DELETE FROM {KEYSPACE}.userline WHERE user = ? AND item = ?",
        "type": "cql"
      }
    ]
  },
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Read data of a User",
    "version": "0.3.0",
    "name": "GetUser",
    "group": "User",
    "permission": [
      {
        "name": "admin",
        "title": "Admin access rights needed. ",
        "description": "<p>Optionally you can write here further Informations about the permission.</p> <p>An &quot;apiDefinePermission&quot;-block can have an &quot;apiVersion&quot;, so you can attach the block to a specific version.</p> "
      }
    ],
    "description": "<p>Compare Verison 0.3.0 with 0.2.0 and you will see the green markers with new items in version 0.3.0 and red markers with removed items since 0.2.0.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Example usage:",
        "content": "curl -i http://localhost/user/4711",
        "type": "json"
      }
    ],
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "registered",
            "description": "<p>Registration Date.</p> "
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "name",
            "description": "<p>Fullname of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "String[]",
            "optional": false,
            "field": "nicknames",
            "description": "<p>List of Users nicknames (Array of Strings).</p> "
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "profile",
            "description": "<p>Profile data (example for an Object)</p> "
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "profile.age",
            "description": "<p>Users age.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "profile.image",
            "description": "<p>Avatar-Image.</p> "
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "options",
            "description": "<p>List of Users options (Array of Objects).</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "options.name",
            "description": "<p>Option Name.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "options.value",
            "description": "<p>Option Value.</p> "
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NoAccessRight",
            "description": "<p>Only authenticated Admins can access the data.</p> "
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>The <code>id</code> of the User was not found.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 401 Not Authenticated\n{\n  \"error\": \"NoAccessRight\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./node_modules/apidoc/example/example.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Read data of a User",
    "version": "0.2.0",
    "name": "GetUser",
    "group": "User",
    "permission": [
      {
        "name": "admin",
        "title": "This title is visible in version 0.1.0 and 0.2.0",
        "description": ""
      }
    ],
    "description": "<p>Here you can describe the function. Multilines are possible.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "name",
            "description": "<p>Fullname of the User.</p> "
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>The <code>id</code> of the User was not found.</p> "
          }
        ]
      }
    },
    "filename": "./node_modules/apidoc/example/_apidoc.js",
    "groupTitle": "User"
  },
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Read data of a User",
    "version": "0.1.0",
    "name": "GetUser",
    "group": "User",
    "permission": [
      {
        "name": "admin",
        "title": "This title is visible in version 0.1.0 and 0.2.0",
        "description": ""
      }
    ],
    "description": "<p>Here you can describe the function. Multilines are possible.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": false,
            "field": "name",
            "description": "<p>Fullname of the User.</p> "
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>The error description text in version 0.1.0.</p> "
          }
        ]
      }
    },
    "filename": "./node_modules/apidoc/example/_apidoc.js",
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user",
    "title": "Create a new User",
    "version": "0.3.0",
    "name": "PostUser",
    "group": "User",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>In this case &quot;apiErrorStructure&quot; is defined and used. Define blocks with params that will be used in several functions, so you dont have to rewrite them.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of the User.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>The new Users-ID.</p> "
          }
        ]
      }
    },
    "filename": "./node_modules/apidoc/example/example.js",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NoAccessRight",
            "description": "<p>Only authenticated Admins can access the data.</p> "
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNameTooShort",
            "description": "<p>Minimum of 5 characters required.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"UserNameTooShort\"\n}",
          "type": "json"
        }
      ]
    },
    "groupTitle": "User"
  },
  {
    "type": "post",
    "url": "/user",
    "title": "Create a User",
    "version": "0.2.0",
    "name": "PostUser",
    "group": "User",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>In this case &quot;apiErrorStructure&quot; is defined and used. Define blocks with params that will be used in several functions, so you dont have to rewrite them.</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of the User.</p> "
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>The Users-ID.</p> "
          }
        ]
      }
    },
    "filename": "./node_modules/apidoc/example/_apidoc.js",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NoAccessRight",
            "description": "<p>Only authenticated Admins can access the data.</p> "
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNameTooShort",
            "description": "<p>Minimum of 5 characters required.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"UserNameTooShort\"\n}",
          "type": "json"
        }
      ]
    },
    "groupTitle": "User"
  },
  {
    "type": "put",
    "url": "/user/:id",
    "title": "Change a User",
    "version": "0.3.0",
    "name": "PutUser",
    "group": "User",
    "permission": [
      {
        "name": "none"
      }
    ],
    "description": "<p>This function has same errors like POST /user, but errors not defined again, they were included with &quot;apiErrorStructure&quot;</p> ",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "name",
            "description": "<p>Name of the User.</p> "
          }
        ]
      }
    },
    "filename": "./node_modules/apidoc/example/example.js",
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "NoAccessRight",
            "description": "<p>Only authenticated Admins can access the data.</p> "
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "UserNameTooShort",
            "description": "<p>Minimum of 5 characters required.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Response (example):",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"UserNameTooShort\"\n}",
          "type": "json"
        }
      ]
    },
    "groupTitle": "User"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p> "
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./client-doc/main.js",
    "group": "_Users_cliftonc_work_seguir_client_doc_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_client_doc_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p> "
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./client/server/main.js",
    "group": "_Users_cliftonc_work_seguir_client_server_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_client_server_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p> "
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/client/main.js",
    "group": "_Users_cliftonc_work_seguir_doc_client_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_doc_client_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p> "
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./doc/server/main.js",
    "group": "_Users_cliftonc_work_seguir_doc_server_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_doc_server_main_js",
    "name": ""
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": false,
            "field": "varname1",
            "description": "<p>No type.</p> "
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "varname2",
            "description": "<p>With type.</p> "
          }
        ]
      }
    },
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "./node_modules/apidoc/template/main.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_apidoc_template_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_apidoc_template_main_js",
    "name": ""
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/bunyan/lib/bunyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_bunyan_lib_bunyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_bunyan_lib_bunyan_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/expect.js/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_expect_js_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/application.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_application_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/express.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_express_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_express_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/middleware/init.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_middleware_init_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_middleware_init_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/middleware/query.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_middleware_query_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_middleware_query_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/request.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_request_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/response.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_response_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/layer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/layer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/layer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/layer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_layer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/route.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/route.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/route.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/route.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/router/route.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_router_route_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/view.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/view.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/lib/view.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_lib_view_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/accepts/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_accepts_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/content-disposition/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_content_disposition_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/cookie-signature/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_cookie_signature_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_cookie_signature_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/cookie-signature/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_cookie_signature_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_cookie_signature_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_browser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_debug_node_modules_ms_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/escape-html/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_escape_html_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_escape_html_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/etag/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/etag/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/etag/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/etag/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/etag/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_etag_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/finalhandler/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/finalhandler/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/finalhandler/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_finalhandler_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/fresh/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_fresh_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_fresh_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/media-typer/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/media-typer/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/media-typer/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/media-typer/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/media-typer/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_media_typer_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/on-finished/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/on-finished/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/on-finished/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/on-finished/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_on_finished_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/parseurl/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/parseurl/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/parseurl/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/parseurl/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_parseurl_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/path-to-regexp/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_path_to_regexp_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_path_to_regexp_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/proxy-addr/node_modules/forwarded/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_node_modules_forwarded_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_proxy_addr_node_modules_forwarded_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/range-parser/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_range_parser_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_range_parser_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/send/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_send_node_modules_ms_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/serve-static/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_serve_static_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_serve_static_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/type-is/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/type-is/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/type-is/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/type-is/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/type-is/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_type_is_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/utils-merge/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_utils_merge_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_utils_merge_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/vary/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/vary/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/express/node_modules/vary/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_express_node_modules_vary_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/events.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_events_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/progress.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/progress.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/browser/progress.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_browser_progress_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/context.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_context_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/hook.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_hook_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_hook_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/hook.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_hook_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_hook_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/ms.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/ms.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/ms.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/ms.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_ms_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/base.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_base_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/doc.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_doc_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_doc_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/dot.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_dot_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_dot_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/html-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_cov_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/html-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_cov_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/html.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_html_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-cov.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_cov_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-stream.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_stream_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_stream_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/json-stream.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_stream_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_json_stream_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/landing.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_landing_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_landing_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/list.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_list_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_list_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/markdown.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_markdown_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_markdown_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/min.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_min_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_min_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/nyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_nyan_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/progress.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_progress_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_progress_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/spec.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_spec_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_spec_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/tap.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_tap_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_tap_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/tap.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_tap_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_tap_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/reporters/xunit.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_xunit_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_reporters_xunit_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runnable.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runnable_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/runner.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_runner_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/suite.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_suite_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/test.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_test_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_test_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/mocha.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_mocha_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/commander/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_commander_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/browser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_browser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/debug.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_debug_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/debug/node_modules/ms/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_debug_node_modules_ms_index_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/growl/lib/growl.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_growl_lib_growl_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_growl_lib_growl_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/compiler.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_compiler_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/jade.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_jade_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/lexer.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_lexer_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/attrs.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/attrs.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/attrs.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/attrs.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_attrs_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block-comment.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_comment_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_comment_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/block.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_block_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/case.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_case_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_case_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/code.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_code_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_code_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/comment.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_comment_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_comment_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/doctype.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_doctype_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_doctype_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/each.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_each_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_each_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/filter.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_filter_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_filter_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/literal.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_literal_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_literal_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/mixin.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_mixin_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_mixin_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_node_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/node.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_node_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_node_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/tag.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/tag.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/tag.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/tag.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_tag_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/nodes/text.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_text_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_nodes_text_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/parser.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_parser_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/lib/utils.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_lib_utils_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/node_modules/commander/lib/commander.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_node_modules_commander_lib_commander_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "private",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/mocha/node_modules/jade/runtime.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_mocha_node_modules_jade_runtime_js",
    "name": "Private"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/restify/node_modules/bunyan/lib/bunyan.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_restify_node_modules_bunyan_lib_bunyan_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_restify_node_modules_bunyan_lib_bunyan_js",
    "name": "Public"
  },
  {
    "type": "",
    "url": "public",
    "title": "",
    "version": "0.0.0",
    "filename": "./node_modules/restify/node_modules/escape-regexp-component/index.js",
    "group": "_Users_cliftonc_work_seguir_node_modules_restify_node_modules_escape_regexp_component_index_js",
    "groupTitle": "_Users_cliftonc_work_seguir_node_modules_restify_node_modules_escape_regexp_component_index_js",
    "name": "Public"
  }
] });