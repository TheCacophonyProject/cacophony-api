module.exports = {
  // JS Shim that doesn't get compiled with the typescript compiler to avoid
  // typescript transforming the dynamic import function into a require, which
  // fails to load modules that are ES module dependencies.
  dynamicImportESM(moduleIdentifier) {
    return import(moduleIdentifier);
  }
};
