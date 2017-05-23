/*global afterAll, beforeAll*/
const expect = require('unexpected');
const pathModule = require('path');
const childProcess = require('child_process');

describe('in afterEach mode', function () {
    const fs = expect.promise.promisifyAll(require('fs'));
    const tmpDir = pathModule.resolve(__dirname, 'tmp');

    (typeof before === 'function' ? before : beforeAll)(() => fs.mkdirAsync(tmpDir).catch(() => {}));
    (typeof after === 'function' ? after : afterAll)(() => fs.rmdirAsync(tmpDir).catch(() => {}));

    const preamble =
        "var fetchception = require('../../');\n" +
        "var expect = require('unexpected');\n";

    expect.addAssertion('<function> when run through mocha <assertion>', (expect, subject) => {
        expect.errorMode = 'nested';
        const code = subject.toString().replace(/^[^{]+\{|\}\s*$/g, '');
        expect.subjectOutput = function (output) {
            output.code(code, 'javascript');
        };
        const tmpFileName = pathModule.resolve(tmpDir, 'fetchception' + Math.round(10000000 * Math.random()) + '.js');
        const testCommand =
            process.argv[0] + ' ' + pathModule.resolve(__dirname, '..', 'node_modules', '.bin', 'mocha') +
            ' --require ' + pathModule.resolve(__dirname, 'mocha', 'setupTests.js') + ' ' + tmpFileName;

        return fs.writeFileAsync(tmpFileName, preamble + code, 'utf-8')
        .then(() => expect.promise.fromNode(cb => childProcess.exec(testCommand, cb.bind(null, null))))
        .then(([stdout, stderr]) => expect.shift(stderr))
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
        }, 'when run through mocha to contain', '✓ should foo\n\n  1 passing');
    });

    it('should fail with a diff when too few requests are made', function () {
        return expect(() => {
            /* eslint-disable */
            it('should foo', function () {
                fetchception({ request: 'GET /', response: 200 });
            });
            /* eslint-enable */
        }, 'when run through mocha to match', /"after each" hook for "should foo"[\s\S]*\/\/ missing:\n\/\/ GET \/\n/);
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
        );
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
        );
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
        );
    });
});
