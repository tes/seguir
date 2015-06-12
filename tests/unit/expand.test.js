/*eslint-env node, mocha */

var expect = require('expect.js');
var expand = require('../../api/common')({}).expandEmbeddedObject;

describe('Embedded object expansion', function () {

  it('does nothing if it doesnt find the test field', function (done) {
    expect(expand({'hello': 'world'}, 'a', 'b')).to.be(undefined);
    done();
  });

  it('expands an object based on the prefix and clean up after itself', function (done) {
    var item = {post: '1', 'post_ignore': 'bob', post_post: '1', post_content: 'alpha', post_date: 'today', another_field: 'value'};
    var embed = {post: '1', 'ignore': 'bob', content: 'alpha', date: 'today'};
    expect(expand(item, 'post', 'content')).to.eql(embed);
    expect(item).to.eql({post: '1', another_field: 'value'});
    done();
  });

  it('expands an object based on the prefix and clean up after itself, ignoring what it is told to ignore', function (done) {
    var item = {post: '1', 'post_ignore': 'bob', post_post: '1', post_content: 'alpha', post_date: 'today', another_field: 'value'};
    var embed = {post: '1', content: 'alpha', date: 'today'};
    expect(expand(item, 'post', 'content', ['post', 'post_ignore'])).to.eql(embed);
    expect(item).to.eql({post: '1', 'post_ignore': 'bob', another_field: 'value'});
    done();
  });

});
