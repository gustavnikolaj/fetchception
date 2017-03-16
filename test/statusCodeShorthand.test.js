const fetchception = require('../');
const expect = require('unexpected');

// TODO: mapping from statusCode shorthand to object notation should be
//       handled in messy / unexpected-messy.

it('should accept a statusCode as response shorthand', () => fetchception({
    request: 'GET /foo',
    response: 200
}, () => {
    return expect(() => fetch('/foo'), 'to be fulfilled');
}));
