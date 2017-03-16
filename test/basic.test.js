const expect = require('unexpected');
const fetchception = require('../');

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
        .then(res => expect(res, 'to satisfy', {
            foo: 'bar'
        }));
}));
