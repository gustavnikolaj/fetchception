/*global afterAll, beforeAll, jasmine*/
const expect = require('unexpected');
const pathModule = require('path');
const childProcess = require('child_process');

// Not sure if this is really the right way to bump the timeout:
if (typeof jasmine !== 'undefined') {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 40000;
}

describe('in afterEach mode', function () {
    const fs = expect.promise.promisifyAll(require('fs'));
    const tmpDir = pathModule.resolve(__dirname, '..', 'tmp');

    (typeof before === 'function' ? before : beforeAll)(() => fs.mkdirAsync(tmpDir).catch(() => {}));
    (typeof after === 'function' ? after : afterAll)(() => fs.rmdirAsync(tmpDir).catch(() => {}));

    const preamble =
        "var fetchception = require('../');\n" +
        "var expect = require('unexpected');\n";

    expect.addAssertion('<function> when run through (mocha|jest) <assertion>', (expect, subject) => {
        expect.errorMode = 'nested';
        const isMocha = expect.alternations[0] === 'mocha';
        const code = subject.toString().replace(/^[^{]+\{|\}\s*$/g, '');
        expect.subjectOutput = function (output) {
            output.code(code, 'javascript');
        };
        const tmpFileName = pathModule.resolve(tmpDir, 'fetchception.' + Math.round(10000000 * Math.random()) + '.test.js');
        let testCommand;
        if (isMocha) {
            testCommand =
                process.argv[0] + ' ' + pathModule.resolve(__dirname, '..', 'node_modules', '.bin', 'mocha') +
                ' --require ' + pathModule.resolve(__dirname, 'mocha', 'setupTests.js') + ' ' + tmpFileName;
        } else {
            // jest
            testCommand =
                process.argv[0] + ' ' + pathModule.resolve(__dirname, '..', 'node_modules', '.bin', 'jest') +
                ' --config ' + pathModule.resolve(__dirname, 'jest', 'jest.config.js') + ' ' + tmpFileName;
        }

        return fs.writeFileAsync(tmpFileName, preamble + code, 'utf-8')
        .then(() => expect.promise.fromNode(cb => childProcess.exec(testCommand, cb.bind(null, null))))
        .then(([_, stdout, stderr]) => expect.shift(isMocha ? stdout : stderr))
        .finally(() => fs.unlinkAsync(tmpFileName));
    });

    it('should succeed when the correct HTTP request is made', function () {
        return expect(() => {
            /* eslint-disable */
            it('should foo', function () {
                fetchception({ request: 'GET /', response: 200 });
                return fetch('/');
            });
            /* eslint-enable */
        }, 'when run through mocha to contain', '✓ should foo\n\n  1 passing')
        .and('when run through jest to contain', '✓ should foo \(');
    });

    it('should fail with a diff when too few requests are made', function () {
        return expect(() => {
            /* eslint-disable */
            it('should foo', function () {
                fetchception({ request: 'GET /', response: 200 });
            });
            /* eslint-enable */
        }, 'when run through mocha to match', /"after each" hook for "should foo"[\s\S]*\/\/ missing:\n\/\/ GET \/\n/)
        .and('when run through jest to match', /FAIL[\s\S]*\/\/ missing:\n\s*\/\/ GET \/\n/);
    });

    it('should fail with a diff when a request does not match the mocked out traffic', function () {
        return expect(() => {
            /* eslint-disable */
            it('should foo', function () {
                fetchception({ request: 'GET /foo', response: 200 });
                return fetch('/bar');
            });
            /* eslint-enable */
        }, 'when run through mocha to contain',
                'GET /bar // should be GET /foo\n' +
                '         //\n' +
                '         // -GET /bar\n' +
                '         // +GET /foo\n' +
                '\n' +
                '\n' +
                'HTTP/1.1 200 OK\n' +
                '\n'
        ).and('when run through jest to contain', 'GET /bar // should be GET /foo');
    });

    it('should fail with a diff the first test out of two fails', function () {
        return expect(() => {
            /* eslint-disable */
            it('should foo', function () {
                fetchception({ request: 'GET /foo', response: 200 });
                return fetch('/bar');
            });

            it('should bar', function () {
                fetchception({ request: 'GET /foo', response: 200 });
                return fetch('/foo');
            });
            /* eslint-enable */
        }, 'when run through mocha to contain',
                'GET /bar // should be GET /foo\n' +
                '         //\n' +
                '         // -GET /bar\n' +
                '         // +GET /foo\n' +
                '\n' +
                '\n' +
                'HTTP/1.1 200 OK\n' +
                '\n'
        ).and('when run through jest to contain', 'GET /bar // should be GET /foo');
    });

    it('should fail with a diff the second test out of two fails', function () {
        return expect(() => {
            /* eslint-disable */
            it('should bar', function () {
                fetchception({ request: 'GET /foo', response: 200 });
                return fetch('/foo');
            });

            it('should foo', function () {
                fetchception({ request: 'GET /foo', response: 200 });
                return fetch('/bar');
            });
            /* eslint-enable */
        }, 'when run through mocha to contain',
                'GET /bar // should be GET /foo\n' +
                '         //\n' +
                '         // -GET /bar\n' +
                '         // +GET /foo\n' +
                '\n' +
                '\n' +
                'HTTP/1.1 200 OK\n' +
                '\n'
        ).and('when run through jest to contain', 'GET /bar // should be GET /foo');
    });
});
