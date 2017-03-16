const fetchception = require('../');
const expect = require('unexpected')
    .clone()
    // We need to include unexpected-messy in the test suite because we assert
    // the output. It is NOT necessary when using fetchception normally.
    .use(require('unexpected-messy'));

// Set up the preferred output width for both the internal expect as well as the
// one we use in this test suite.
expect.output.preferredWidth = 80;
fetchception.expect.output.preferredWidth = 80;

it('should pass a basic test', () => {
    expect('foo', 'to be ok');
});

it('should be a function', () => {
    expect(fetchception, 'to be a function');
});

it('a global fetch should be available', () => {
    expect(fetch, 'to be a function');
});

it('should error with a failing promise based assertion', () => {
    return expect(() => fetchception([], () => {
        return Promise.reject('foo');
    }), 'to error', 'foo');
});

it('should not error with a passing a promise based assertion', () => {
    return expect(() => fetchception([], () => {
        return Promise.resolve();
    }), 'not to error');
});

it('should fail if a promise is not returned', () => {
    return expect(
        () => fetchception([], () => {}),
        'to error',
        'fetchception: You must return a promise from the supplied function.'
    );
});

it('should swap out fetch for the duration of fetchception', () => {
    const originalFetch = fetch;
    return expect(() => fetchception([], () => {
        return expect(originalFetch, 'not to be', fetch);
    }), 'not to error').then(() => {
        return expect(originalFetch, 'to be', fetch);
    });
});

it('should pass with a basic mock', () => fetchception([
    {
        request: '/api/foo',
        response: {
            statusCode: 200,
            body: { foo: 'bar' }
        }
    }
], () => {
    return fetch('/api/foo')
        .then(res => res.json())
        .then(res => expect(res, 'to equal', {
            foo: 'bar'
        }));
}));

it('should fail when request is not matching', () => {
    return expect(() => fetchception(
        [{ request: '/api/foo', response: { statusCode: 200 } }],
        () => fetch('/api/bar')
    ), 'to error', [
        'expected',
        'GET /api/bar',
        '',
        'HTTP/1.1 200 OK',
        "to satisfy { exchanges: [ { request: '/api/foo', response: ... } ] }",
        '',
        'GET /api/bar // should be GET /api/foo',
        '             //',
        '             // -GET /api/bar',
        '             // +GET /api/foo',
        '',
        '',
        'HTTP/1.1 200 OK'
    ].join('\n'));
    // return fetchception(
    //     [{ request: '/api/foo', response: { statusCode: 200 } }],
    //     () => fetch('/api/bar')
    // );
});


it('should fail when all requests are not made', () => {
    return expect(() => fetchception([
        { request: '/api/bar', response: { statusCode: 200 } },
        { request: '/api/foo', response: { statusCode: 200 } }
    ], () => fetch('/api/bar')), 'to error', [
        'expected',
        'GET /api/bar',
        '',
        'HTTP/1.1 200 OK',
        'to satisfy',
        '{',
        '  exchanges: [',
        "    { request: '/api/bar', response: ... },",
        "    { request: '/api/foo', response: ... }",
        '  ]',
        '}',
        '',
        'GET /api/bar',
        '',
        'HTTP/1.1 200 OK',
        '',
        '// missing:',
        '// GET /api/foo',
        '//',
        '// 200'
    ].join('\n'));
});
