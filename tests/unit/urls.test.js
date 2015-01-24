'use strict';

var expect = require('expect.js');
var u = require('../../api/urls');

describe('Urls', function() {

    describe('url parsing', function () {

      it('default is it just returns the url pattern', function(done) {
        expect(u('getUserByName')).to.be('/username/:username');
        done();
      });

      it('if i pass it data it creates the URL', function(done) {
        var data = {username:'cliftonc'};
        expect(u('getUserByName', data)).to.be('/username/cliftonc');
        done();
      });

    });

});
