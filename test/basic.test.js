const expect = require('unexpected');
const fetchception = require('../');

it('should pass a basic test', () => {
    expect('foo', 'to be ok');
});

it('should be a function', () => {
    expect(fetchception, 'to be a function');
});
