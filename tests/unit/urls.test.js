/*eslint-env node, mocha */

var expect = require('expect.js');
var u = require('../../api/urls');

describe('Urls', function () {

  describe('url parsing', function () {

    it('default is it just returns the url pattern', function (done) {
      expect(u('getUserByName')).to.be('/username/:username');
      done();
    });

    it('if i pass it data it creates the URL', function (done) {
      var data = {username: 'cliftonc'};
      expect(u('getUserByName', data)).to.be('/username/cliftonc');
      done();
    });

    it('if i pass it data that contains a query string it appends it', function (done) {
      var data = {username: 'cliftonc', query: 'type=user'};
      expect(u('getUserByName', data)).to.be('/username/cliftonc?type=user');
      done();
    });

  });

});
