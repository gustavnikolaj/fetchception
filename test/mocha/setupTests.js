// create jsdom environment
const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html>`, {
  url: "http://localhost",
});
const window = dom.window;

global.URLSearchParams = window.URLSearchParams;

// Copy over all properties from window that do not yet exist on nodes global
// over to the global object.
// Later we might want to filter some of them, but for now it seems to work just
// fine when copying everything over like this.
Object.keys(window).forEach((key) => {
  if (typeof global[key] === "undefined") {
    global[key] = window[key];
  }
});

// Setup fetch polyfill and copy the references the polyfill installs into the
// window over into the global object.
const wwgFetch = require("whatwg-fetch");

global.fetch = wwgFetch.fetch;
global.Headers = wwgFetch.Headers;
global.Request = wwgFetch.Request;
global.Response = wwgFetch.Response;
