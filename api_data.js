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
    "url": "/username/:user/followers",
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
    "title": "Get details of any relationship between with a specific user",
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
          "content": "HTTP/1.1 200 OK\n{\n  \"user\":\"cbeab41d-2372-4017-ac50-d8d63802d452\",\n  \"username\":\"cliftonc\",\n  \"friend\": 1421585133444,\n  \"follow\": null\n}",
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
    "filename": "./doc/main.js",
    "group": "_Users_cliftonc_work_seguir_doc_main_js",
    "groupTitle": "_Users_cliftonc_work_seguir_doc_main_js",
    "name": ""
  }
] });