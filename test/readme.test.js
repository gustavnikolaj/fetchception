/* global fetch */

const fetchception = require("../");
const assert = require("assert");

it("should cleanly mock out fetch in the test", () =>
  fetchception(
    [
      {
        request: "/api/foo",
        response: {
          statusCode: 200,
          body: { foo: "bar" }
        }
      }
    ],
    () => {
      return fetch("/api/foo")
        .then(res => res.json())
        .then(res => {
          assert.equal(res.foo, "bar");
        });
    }
  ));
