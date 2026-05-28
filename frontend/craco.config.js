module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. Desactivar por completo las advertencias de source-maps en node_modules
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
      ];

      // 2. Solucionar el error de "Can't resolve 'fs'" (le dice a Webpack que ignore 'fs' en el navegador)
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };

      return webpackConfig;
    },
  },
};