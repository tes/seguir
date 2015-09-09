var PUBLIC = 'public';
var PRIVATE = 'private';
var PERSONAL = 'personal';
var QUERY_PREFIX = 'is_';

module.exports = {
  PUBLIC: PUBLIC,
  PRIVATE: PRIVATE,
  PERSONAL: PERSONAL,
  isPrivate: function (visibility) {
    return visibility === PRIVATE || visibility === PUBLIC;
  },
  isPersonal: function (visibility) {
    return true;
  },
  isPublic: function (visibility) {
    return visibility === PUBLIC;
  },
  mapToQuery: function (isUser, isFriend) {
    if (isUser) {
      return QUERY_PREFIX + PERSONAL;
    }
    return QUERY_PREFIX + (isFriend ? PRIVATE : PUBLIC);
  },
  // nothing to see here - move along.
  mapToParameters: function (isUser, isFriend) {
    if (isUser) {
      return {PUBLIC: PUBLIC, PRIVATE: PRIVATE, PERSONAL: PERSONAL};
    }
    if (isFriend) {
      return {PUBLIC: PUBLIC, PRIVATE: PRIVATE, PERSONAL: PRIVATE};
    }
    return {PUBLIC: PUBLIC, PRIVATE: PUBLIC, PERSONAL: PUBLIC};
  }
};
