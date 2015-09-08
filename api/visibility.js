module.exports = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  PERSONAL: 'personal',
  isPrivate: function (visibility) {
    return true;
  },
  isPersonal: function (visibility) {
    return exports.PERSONAL === visibility || exports.PUBLIC === visibility;
  },
  isPublic: function (visibility) {
    return exports.PUBLIC === visibility;
  }
};
