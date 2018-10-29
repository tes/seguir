/* eslint-env node, mocha */

const expect = require('expect.js');
const u = require('../../api/urls');

describe('Urls', () => {
  describe('url parsing', () => {
    it('default is it just returns the url pattern', (done) => {
      expect(u('getUserByName')).to.be('/username/:username');
      done();
    });

    it('if i pass it data it creates the URL', (done) => {
      const data = { username: 'cliftonc' };
      expect(u('getUserByName', data)).to.be('/username/cliftonc');
      done();
    });

    it('if i pass it data that contains a query string it appends it', (done) => {
      const data = { username: 'cliftonc', query: 'type=user' };
      expect(u('getUserByName', data)).to.be('/username/cliftonc?type=user');
      done();
    });
  });
});
