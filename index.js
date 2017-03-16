
// export a promise factory for it methods

// install fetch mock
// validate fetch requests

// reject fetch promise when the requests don't match

// tear down fetch mock

function fetchception(mocks, promiseFactory) {
    const promise = promiseFactory();

    if (!promise || typeof promise.then !== 'function') {
        throw new Error('fetchception: You must return a promise from the supplied function.');
    }

    return promise;
}

module.exports = fetchception;
