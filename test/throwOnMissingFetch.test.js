const fetchception = require("../");
const expect = require("unexpected")
  .clone()
  // We need to include unexpected-messy in the test suite because we assert
  // the output. It is NOT necessary when using fetchception normally.
  .use(require("unexpected-messy"));

// Set up the preferred output width for both the internal expect as well as the
// one we use in this test suite.
expect.output.preferredWidth = 80;
fetchception.expect.output.preferredWidth = 80;

let originalFetch;

describe("with no global fetch", () => {
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = undefined;
  });

  it("should complain if no fetch is available", () => {
    return expect(
      () => fetchception([], () => {}),
      "to throw",
      "fetchception: Did not find a global.fetch. Make sure that you load a fetch polyfill if you are running your tests in an environment with no native implementation."
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });
});
