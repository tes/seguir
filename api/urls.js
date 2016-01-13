/**
 * Templates for the urls shared between client and server
 */
var _ = require('lodash');

var urls = {
  addUser: '/user',
  getUser: '/user/:user',
  updateUser: '/user/:user',
  getUserByName: '/username/:username',
  getUserByAltId: '/useraltid/:altid',
  getUserRelationship: '/user/:user/relationship',
  addPost: '/post',
  getPost: '/post/:post',
  getPostByAltid: '/post/:altid/altid',
  getPostsByAltid: '/post/:altid/altid',
  updatePost: '/post/:post',
  updatePostByAltid: '/post/:altid/update/altid',
  removePost: '/post/:post',
  removePostByAltid: '/post/:altid/altid',
  removePostsByAltid: '/post/:altid/altid',
  addFriend: '/friend',
  getFriend: '/friend/:friend',
  removeFriend: '/user/:user/friend/:user_friend',
  getFriends: '/user/:user/friends',
  addFriendRequest: '/friend-request',
  getFriendRequests: '/friend-request/active',
  acceptFriendRequest: '/friend-request/accept',
  addFollower: '/follower',
  getFollow: '/follower/:follow',
  removeFollower: '/user/:user/follower/:user_follower',
  getFollowers: '/user/:user/followers',
  addLike: '/like',
  getLike: '/like/:like',
  checkLike: '/user/:user/like/:item',
  removeLike: '/user/:user/like/:item',
  getFeed: '/feed/:user',
  getUserFeed: '/feed/:user/direct'
};

module.exports = function (url, data) {
  if (urls[url]) {
    var expectsData = url.indexOf(':') > 0;
    if (data) {
      var pattern = urls[url];
      _.keys(data).forEach(function (key) {
        var item = data[key];
        if (item) {
          // Ensure item is URI encoded if it isn't already
          item = decodeURIComponent(item) !== item ? item : encodeURIComponent(item);
          pattern = pattern.replace(':' + key, item);
        }
      });
      if (data.query) {
        pattern += '?' + data.query;
      }
      return pattern;
    } else {
      if (expectsData) {
        console.log('No data provided to url: ' + url + ' > ' + urls[url]);
      }
      return urls[url];
    }
  } else {
    console.log('Unable to locate URL: ' + url);
    return '';
  }
};
