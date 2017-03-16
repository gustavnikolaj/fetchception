const http = require('http');
const messy = require('messy');
const expect = require('unexpected')
    .clone()
    .use(require('unexpected-messy'));

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

// function createErrorResponse() {
//     const response = new global.Response(null, {status: 0, statusText: ''});
//     response.type = 'error';
//     return response;
// }

function createActualRequestModel(url, opts) {
    const requestOptions = Object.assign({ url, method: 'GET' }, opts);
    return new messy.HttpRequest(requestOptions);
};

function verifyRequest(actualRequest, expectedRequest) {
    // Handle potential oathbreaking of the assertion.
    var promise;
    try {
        promise = expect(actualRequest, 'to satisfy', expectedRequest);
    } catch (e) {
        promise = Promise.reject(e);
    }
    return promise;
}


function verifyConversation(expectedExchanges, actualConversation, err) {
    return expect(actualConversation, 'to satisfy', {
        exchanges: expectedExchanges
    }).then(() => {
        if (err) {
            // The conversations matched so we will rethrow the error
            throw err;
        }
    });
}

function fetchception(mocks, promiseFactory) {
    const originalFetch = global.fetch;
    const restoreFetch = () => global.fetch = originalFetch;
    const httpConversation = new messy.HttpConversation();
    global.fetch = (url, opts) => {
        const responseProperties = mocks[0].response;
        const requestProperties = mocks[0].request;
        const actualRequest = createActualRequestModel(url, opts);
        const mockResponse = createMockResponse(responseProperties);

        return verifyRequest(actualRequest, requestProperties).then(
            res => {
                var responseBody = mockResponse._body;

                if (responseBody && typeof responseBody === 'object') {
                    responseBody = JSON.stringify(responseBody);
                    mockResponse.headers.set('Content-Type', 'application/json');
                }

                httpConversation.exchanges.push(new messy.HttpExchange({
                    request: actualRequest,
                    response: mockResponse
                }));

                const response = new global.Response(responseBody, {
                    status: mockResponse.statusLine.statusCode,
                    statusText: mockResponse.statusLine.statusMessage,
                    headers: mockResponse.headers.valuesByName
                });

                return response;
            },
            () => {
                // the request didn't match, so we create a failing response to
                // break the code asap
                const error = new TypeError('Network request failed');

                httpConversation.exchanges.push(new messy.HttpExchange({
                    request: actualRequest,
                    response: mockResponse
                }));

                throw error;
            }
        );
    };

    const promise = promiseFactory(); // TODO: handle throws

    if (!promise || typeof promise.then !== 'function') {
        restoreFetch();
        throw new Error('fetchception: You must return a promise from the supplied function.');
    }

    return expect.promise(() => promise)
        .then(
            () => verifyConversation(mocks, httpConversation),
            (err) => verifyConversation(mocks, httpConversation, err)
        )
        .finally(() => restoreFetch());
}

module.exports = fetchception;

// Expose the internal unexpected instance.
module.exports.expect = expect;
