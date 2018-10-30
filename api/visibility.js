const PUBLIC = 'public';
const PRIVATE = 'private';
const PERSONAL = 'personal';
const QUERY_PREFIX = 'is_';

module.exports = {
  PUBLIC,
  PRIVATE,
  PERSONAL,
  isPrivate: visibility => visibility === PRIVATE || visibility === PUBLIC,
  isPersonal: visibility => true, // eslint-disable-line no-unused-vars
  isPublic: visibility => visibility === PUBLIC,
  mapToQuery: (isUser, isFriend) => {
    if (isUser) {
      return QUERY_PREFIX + PERSONAL;
    }
    return QUERY_PREFIX + (isFriend ? PRIVATE : PUBLIC);
  },
  // nothing to see here - move along.
  mapToParameters: (isUser, isFriend) => {
    if (isUser) {
      return { PUBLIC, PRIVATE, PERSONAL };
    }
    if (isFriend) {
      return { PUBLIC, PRIVATE, PERSONAL: PRIVATE };
    }
    return { PUBLIC, PRIVATE: PUBLIC, PERSONAL: PUBLIC };
  },
};
