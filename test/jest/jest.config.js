module.exports = {
    setupFiles: ['whatwg-fetch'],
    rootDir: require('path').resolve(__dirname, '../..'),
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['**/*.{js,jsx}', '!(test|coverage|node_modules)/**']
};
