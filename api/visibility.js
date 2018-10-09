const PUBLIC = 'public';
const PRIVATE = 'private';
const PERSONAL = 'personal';
const QUERY_PREFIX = 'is_';

module.exports = {
  PUBLIC,
  PRIVATE,
  PERSONAL,
  isPrivate: visibility => visibility === PRIVATE || visibility === PUBLIC,
  isPersonal: visibility => true,
  isPublic: visibility => visibility === PUBLIC,
  mapToQuery: (isUser, isFriend) => {
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
