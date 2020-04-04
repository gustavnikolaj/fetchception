module.exports = {
  setupFiles: ["whatwg-fetch"],
  rootDir: require("path").resolve(__dirname, "../.."),
  testEnvironment: "jsdom",
  testURL: "http://localhost",
  collectCoverageFrom: ["**/*.{js,jsx}", "!(test|coverage|node_modules)/**"],
};
