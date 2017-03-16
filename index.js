const http = require('http');
const messy = require('messy');
// const expect = require('unexpected')
//     .clone()
//     .use(require('unexpected-messy'));

// export a promise factory for it methods

// install fetch mock
// validate fetch requests

// reject fetch promise when the requests don't match

// tear down fetch mock

function createMockResponse(responseProperties) {
    if (typeof responseProperties === 'object' && responseProperties.body && typeof responseProperties.body === 'string') {
        responseProperties = Object.assign({}, responseProperties);
        responseProperties.unchunkedBody = responseProperties.body;
        delete responseProperties.body;
    }
    var mockResponse = new messy.HttpResponse(responseProperties);
    mockResponse.statusCode = mockResponse.statusCode || 200;
    mockResponse.protocolName = mockResponse.protocolName || 'HTTP';
    mockResponse.protocolVersion = mockResponse.protocolVersion || '1.1';
    mockResponse.statusMessage = mockResponse.statusMessage || http.STATUS_CODES[mockResponse.statusCode];
    return mockResponse;
}

function fetchception(mocks, promiseFactory) {
    const originalFetch = global.fetch;
    global.fetch = (url, opts) => {
        const responseProperties = mocks[0].response;
        const messyResponse = createMockResponse(responseProperties);

        var responseBody = messyResponse._body;

        if (responseBody && typeof responseBody === 'object') {
            responseBody = JSON.stringify(responseBody);
            messyResponse.headers.set('Content-Type', 'application/json');
        }

        const response = new global.Response(responseBody, {
            status: messyResponse.statusLine.statusCode,
            statusText: messyResponse.statusLine.statusMessage,
            headers: messyResponse.headers.valuesByName
        });

        return Promise.resolve(response);
    };
    const restoreFetch = () => global.fetch = originalFetch;

    const promise = promiseFactory();

    if (!promise || typeof promise.then !== 'function') {
        throw new Error('fetchception: You must return a promise from the supplied function.');
    }

    return promise.then(
        (result) => {
            restoreFetch();
            return result;
        },
        (err) => {
            restoreFetch();
            throw err;
        }
    );
}

module.exports = fetchception;
