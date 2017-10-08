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

it('should allow passing a single exchange pair directly', () => fetchception({
    request: '/api/foo',
    response: {
        statusCode: 200,
        body: { foo: 'bar' }
    }
}, () => {
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

it('should fail when more requests are made', () => {
    return expect(() => fetchception([
        { request: '/api/foo', response: { statusCode: 200 } }
    ], () => fetch('/api/foo').then(() => fetch('/api/bar'))), 'to error', [
        'expected',
        'GET /api/foo',
        '',
        'HTTP/1.1 200 OK',
        '',
        'GET /api/bar',
        '',
        'HTTP/1.1 200 OK',
        "to satisfy { exchanges: [ { request: '/api/foo', response: ... } ] }",
        '',
        'GET /api/foo',
        '',
        'HTTP/1.1 200 OK',
        '',
        '// should be removed:',
        '// GET /api/bar',
        '//',
        '// HTTP/1.1 200 OK'
    ].join('\n'));
});

it('should fail if any requests are made with no exchanges defined (passed as empty array)', () => {
    return expect(() => fetchception([], () => fetch('/api/foo')), 'to error', [
        'expected',
        'GET /api/foo',
        '',
        'HTTP/1.1 200 OK',
        'to satisfy { exchanges: [] }',
        '',
        '// should be removed:',
        '// GET /api/foo',
        '//',
        '// HTTP/1.1 200 OK'
    ].join('\n'));
});

it('should fail if any requests are made with no exchanges defined (passed as undefined)', () => {
    return expect(() => fetchception(undefined, () => fetch('/api/foo')), 'to error', [
        'expected',
        'GET /api/foo',
        '',
        'HTTP/1.1 200 OK',
        'to satisfy { exchanges: [] }',
        '',
        '// should be removed:',
        '// GET /api/foo',
        '//',
        '// HTTP/1.1 200 OK'
    ].join('\n'));
});

it('should fail if any requests are made with no exchanges defined (shorthand)', () => {
    return expect(() => fetchception(() => fetch('/api/foo')), 'to error', [
        'expected',
        'GET /api/foo',
        '',
        'HTTP/1.1 200 OK',
        'to satisfy { exchanges: [] }',
        '',
        '// should be removed:',
        '// GET /api/foo',
        '//',
        '// HTTP/1.1 200 OK'
    ].join('\n'));
});

it('should accept a statusCode as response shorthand', () => fetchception({
    request: 'GET /foo',
    response: 200
}, () => {
    return expect(() => fetch('/foo'), 'to be fulfilled');
}));

it('should allow specifying an application/json response by passing the body as an object', function () {
    return expect(() => fetchception([
        { request: '/api/foo', response: { body: { foo: 123 } } }
    ], () => fetch('/api/foo')
        .then(res => {
            expect(res.headers.get('Content-Type'), 'to equal', 'application/json');
            return res.json();
        })
        .then(res => {
            expect(res, 'to equal', { foo: 123 });
        })
    ), 'not to error');
});

// Test indirectly by inspecting the error message:
it('should allow specifying an expected application/json request by passing the body as an object', function () {
    return expect(() => fetchception([
      { request: { url: '/api/foo', body: { foo: 123 } }, response: 200 }
    ], () => fetch('/api/bar', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foo: 123 }) })), 'to error',
        'expected\n' +
        'GET /api/bar\n' +
        'Content-Type: application/json\n' +
        '\n' +
        '{ foo: 123 }\n' +
        '\n' +
        'HTTP/1.1 200 OK\n' +
        'to satisfy { exchanges: [ { request: ..., response: 200 } ] }\n' +
        '\n' +
        'GET /api/bar // should be /api/foo\n' +
        '             //\n' +
        '             // -GET /api/bar\n' +
        '             // +GET /api/foo\n' +
        'Content-Type: application/json\n' +
        '\n' +
        '{ foo: 123 }\n' +
        '\n' +
        'HTTP/1.1 200 OK'
    );
});

it('should allow specifying an already serialized JSON request body as a string', function () {
    return expect(() => fetchception([
        { request: '/api/foo', response: { headers: { 'Content-Type': 'application/json'}, body: '{"foo":   123}' } }
    ], () => fetch('/api/foo')
        .then(res => res.json())
        .then(res => expect(res, 'to equal', {
            foo: 123
        }))
    ), 'not to error');
});

// Test indirectly by inspecting the error message:
it('should allow specifying the expected query string via the `query` option', function () {
    return expect(() => fetchception([
        { request: { url: '/api/foo', query: { foo: [ 'bar', 'quux' ] } }, response: 200 }
    ], () => fetch('/api/bar?foo%5B0%5D=bar&foo%5B1%5D=quux')), 'to error',
        'expected\n' +
        'GET /api/bar?foo%5B0%5D=bar&foo%5B1%5D=quux\n' +
        '\n' +
        'HTTP/1.1 200 OK\n' +
        'to satisfy { exchanges: [ { request: ..., response: 200 } ] }\n' +
        '\n' +
        'GET /api/bar?foo%5B0%5D=bar&foo%5B1%5D=quux // should be /api/foo?foo%5B0%5D=bar&foo%5B1%5D=quux\n' +
        '                                            //\n' +
        '                                            // -GET /api/bar?foo%5B0%5D=bar&foo%5B1%5D=quux\n' +
        '                                            // +GET /api/foo?foo%5B0%5D=bar&foo%5B1%5D=quux\n' +
        '\n' +
        '\n' +
        'HTTP/1.1 200 OK'
    );
});

it('should allow specifying the expected method as part of the request shorthand', function () {
    return expect(() => fetchception([
        { request: 'POST /api/foo', response: 200 }
    ], () => fetch('/api/foo', { method: 'POST' })), 'not to error');
});

it('should allow specifying the expected method as part of the request url', function () {
    return expect(() => fetchception([
        { request: { url: 'POST /api/foo' }, response: 200 }
    ], () => fetch('/api/foo', { method: 'POST' })), 'not to error');
});

it('should mock out a single request and succeed when it is performed', function () {
    fetchception({
        request: 'GET /api/foo',
        response: 200
    });

    return fetch('/api/foo');
});

it('should mock out two requests given in separate fetchception calls and succeed when they are performed', function () {
    fetchception({
        request: 'GET /api/foo',
        response: 200
    });

    fetchception({
        request: 'GET /api/bar',
        response: 200
    });

    return fetch('/api/foo')
        .then(() => fetch('/api/bar'));
});

it('should mock out two requests given as an array and succeed when they are performed', function () {
    fetchception([
        {
            request: 'GET /api/foo',
            response: 200
        },
        {
            request: 'GET /api/bar',
            response: 200
        }
    ]);

    return fetch('/api/foo')
        .then(() => fetch('/api/bar'));
});

it('should succeed', function () {
    return fetchception({
        request: 'GET /api/foo',
        response: 200
    }, () => fetch('/api/foo'));
});

it('should succeed when a single function is passed and it does not perform any HTTP requests', function () {
    return fetchception(() => Promise.resolve());
});

it('should fail when no HTTP requests are made and there is a one mocked out', function () {
    return expect(
        fetchception({
            request: 'GET /api/foo',
            response: 200
        }, () => Promise.resolve()),
        'to be rejected with',
            'expected <empty conversation>\n' +
            'to satisfy { exchanges: [ { request: \'GET /api/foo\', response: 200 } ] }\n' +
            '\n' +
            '// missing:\n' +
            '// GET /api/foo\n' +
            '//\n' +
            '// 200'
    );
});

it('should fail when no HTTP requests are made and there is a one mocked out (given as an array)', function () {
    return expect(
        fetchception([
            {
                request: 'GET /api/foo',
                response: 200
            }
        ], () => Promise.resolve()),
        'to be rejected with',
            'expected <empty conversation>\n' +
            'to satisfy { exchanges: [ { request: \'GET /api/foo\', response: 200 } ] }\n' +
            '\n' +
            '// missing:\n' +
            '// GET /api/foo\n' +
            '//\n' +
            '// 200'
    );
});

describe('when queueing up mock traffic before the promise factory is invoked', function () {
    it('should succeed', function () {
        fetchception({
            request: 'GET /api/foo',
            response: 200
        });

        return fetchception([], () => fetch('/api/foo'));
    });

    it('should succeed when queueing up twice', function () {
        fetchception({
            request: 'GET /api/foo',
            response: 200
        });

        fetchception({
            request: 'GET /api/bar',
            response: 200
        });

        return fetchception(
            () => fetch('/api/foo')
                .then(() => fetch('/api/bar'))
        );
    });

    it('should succeed when additional traffic is passed to the fetchception call that launches the promise factory', function () {
        fetchception({
            request: 'GET /api/foo',
            response: 200
        });

        return fetchception({
            request: 'GET /api/bar',
            response: 200
        }, () => fetch('/api/foo')
            .then(() => fetch('/api/bar'))
        );
    });

    it('should fail with a diff', function () {
        fetchception({
            request: 'GET /api/foo',
            response: 200
        });
        return expect(
            fetchception(() => fetch('/api/bar')),
            'to be rejected with',
            'expected\n' +
            'GET /api/bar\n' +
            '\n' +
            'HTTP/1.1 200 OK\n' +
            'to satisfy { exchanges: [ { request: \'GET /api/foo\', response: 200 } ] }\n' +
            '\n' +
            'GET /api/bar // should be GET /api/foo\n' +
            '             //\n' +
            '             // -GET /api/bar\n' +
            '             // +GET /api/foo\n' +
            '\n' +
            '\n' +
            'HTTP/1.1 200 OK'
        );
    });
});
