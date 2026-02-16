// typescript-runner.js - Transpiles TypeScript to JavaScript via esbuild-wasm, then executes

self.TypeScriptRunner = {
  initialized: false,

  async init() {
    // Load esbuild-wasm for TS transpilation
    importScripts('https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.2/lib/browser.min.js');
    await self.esbuild.initialize({
      wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.2/esbuild.wasm'
    });
    self.TypeScriptRunner.initialized = true;

    // Ensure JS runner is available for execution
    if (!self.JavaScriptRunner) {
      importScripts('/judge/runners/javascript-runner.js');
    }
  },

  async runTests(code, problemDef) {
    // Transpile TypeScript to JavaScript
    var result = await self.esbuild.transform(code, {
      loader: 'ts',
      target: 'es2020'
    });

    // Delegate execution to JavaScript runner
    return self.JavaScriptRunner.runTests(result.code, problemDef);
  }
};
