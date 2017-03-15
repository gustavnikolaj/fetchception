// create jsdom environment
const document = require('jsdom').jsdom();
const window = document.defaultView;

// Copy over all properties from window to the global object.
// Later we might want to filter some of them, but for now it seems to work just
// fine when copying everything over with no exceptions - even toString and the
// reference to window itself.
Object.keys(window).forEach(key => global[key] = window[key]);

// Setup fetch polyfill and copy the references the polyfill installs into the
// window over into the global object.
require('whatwg-fetch');
global.fetch = window.fetch;
global.Headers = window.Headers;
global.Request = window.Request;
global.Response = window.Response;
