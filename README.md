# fetchception

[![npm version](https://badge.fury.io/js/fetchception.svg)](https://www.npmjs.com/package/fetchception)
[![Build Status](https://travis-ci.org/gustavnikolaj/fetchception.svg?branch=master)](https://travis-ci.org/gustavnikolaj/fetchception)

Mock out network traffic from `fetch` in tests. Experiment based on idea from
[fileception](https://github.com/papandreou/fileception) and
[httpception](https://github.com/papandreou/httpception). Utilizing the great
modelling, inspection and diffing of HTTP conversations from
[messy](https://github.com/papandreou/messy) and
[unexpected-messy](https://github.com/unexpectedjs/unexpected-messy).

```js
const fetchception = require("fetchception");
const assert = require("assert");

it("should cleanly mock out fetch in the test", () =>
  fetchception(
    [
      {
        request: "/api/foo",
        response: {
          statusCode: 200,
          body: { foo: "bar" },
        },
      },
    ],
    () => {
      return fetch("/api/foo")
        .then((res) => res.json())
        .then((res) => {
          assert.strictEqual(res.foo, "bar");
        });
    }
  ));
```

When the test is done, the fetch global will automatically be restored.
