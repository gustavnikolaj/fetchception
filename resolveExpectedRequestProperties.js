// TODO: UPSTREAM ME - or rip out and use an already modularized or upstreamed-to-messy-version of this.

var urlModule = require("url");

module.exports = function resolveExpectedRequestProperties(
  expectedRequestProperties
) {
  if (typeof expectedRequestProperties === "string") {
    expectedRequestProperties = { url: expectedRequestProperties };
  } else if (
    expectedRequestProperties &&
    typeof expectedRequestProperties === "object"
  ) {
    expectedRequestProperties = Object.assign({}, expectedRequestProperties);
  }
  if (expectedRequestProperties) {
    if (typeof expectedRequestProperties.url === "string") {
      var matchMethod = expectedRequestProperties.url.match(
        /^([A-Z]+) ([\s\S]*)$/
      );
      if (matchMethod) {
        expectedRequestProperties.method =
          expectedRequestProperties.method || matchMethod[1];
        expectedRequestProperties.url = matchMethod[2];
      } else if (!expectedRequestProperties.method) {
        expectedRequestProperties.method = "GET";
      }
    }
  } else {
    expectedRequestProperties = {};
  }
  if (/^https?:\/\//.test(expectedRequestProperties.url)) {
    var urlObj = new urlModule.URL(expectedRequestProperties.url);
    expectedRequestProperties.headers = expectedRequestProperties.headers || {};
    if (
      Object.keys(expectedRequestProperties.headers).every(function (key) {
        return key.toLowerCase() !== "host";
      })
    ) {
      expectedRequestProperties.headers.Host = urlObj.host;
    }
    expectedRequestProperties.host =
      expectedRequestProperties.host || urlObj.hostname;
    if (urlObj.port && typeof expectedRequestProperties.port === "undefined") {
      expectedRequestProperties.port = parseInt(urlObj.port, 10);
    }

    if (
      urlObj.protocol === "https:" &&
      typeof expectedRequestProperties.encrypted === "undefined"
    ) {
      expectedRequestProperties.encrypted = true;
    }
    expectedRequestProperties.url = urlObj.pathname + urlObj.search;
  }

  var expectedRequestBody = expectedRequestProperties.body;
  if (
    Array.isArray(expectedRequestBody) ||
    (expectedRequestBody && typeof expectedRequestBody === "object")
  ) {
    expectedRequestProperties.headers = expectedRequestProperties.headers || {};
    if (
      Object.keys(expectedRequestProperties.headers).every(function (key) {
        return key.toLowerCase() !== "content-type";
      })
    ) {
      expectedRequestProperties.headers["Content-Type"] = "application/json";
    }
  }

  return expectedRequestProperties;
};
