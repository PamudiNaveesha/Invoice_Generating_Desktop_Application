const webpack = require('webpack');
const globalThisPolyfill = require('globalthis')();  // Import the globalThis polyfill

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          global: 'globalThis',  // Provide globalThis for older browsers
        })
      );

      // Add the fallback configuration for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        path: require.resolve('path-browserify'),  // Polyfill for 'path' in the browser
      };

      return webpackConfig;
    },
  },
};
