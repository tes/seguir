/* eslint-env node, mocha */

const expect = require('expect.js');
const expand = require('../../api/common')({ client: {} }).expandEmbeddedObject;

describe('Embedded object expansion', () => {
  it('does nothing if it doesnt find the test field', (done) => {
    expect(expand({ hello: 'world' }, 'a', 'b')).to.be(undefined);
    done();
  });

  it('expands an object based on the prefix and clean up after itself', (done) => {
    const item = { post: '1', post_ignore: 'bob', post_post: '1', post_content: 'alpha', post_date: 'today', another_field: 'value' };
    const embed = { post: '1', ignore: 'bob', content: 'alpha', date: 'today' };
    expect(expand(item, 'post', 'content')).to.eql(embed);
    expect(item).to.eql({ post: '1', another_field: 'value' });
    done();
  });

  it('expands an object based on the prefix and clean up after itself, ignoring what it is told to ignore', (done) => {
    const item = { post: '1', post_ignore: 'bob', post_post: '1', post_content: 'alpha', post_date: 'today', another_field: 'value' };
    const embed = { post: '1', content: 'alpha', date: 'today' };
    expect(expand(item, 'post', 'content', ['post', 'post_ignore'])).to.eql(embed);
    expect(item).to.eql({ post: '1', post_ignore: 'bob', another_field: 'value' });
    done();
  });
});
