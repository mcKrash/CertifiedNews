module.exports = {
  hooks: {
    readPackage(pkg) {
      // Ensure binaries are properly hoisted
      if (pkg.name === 'web' || pkg.name === 'api') {
        pkg.publishConfig = pkg.publishConfig || {};
      }
      return pkg;
    },
  },
};
