// go-runner.js - Go code execution (experimental)
// Uses Yaegi Go interpreter compiled to WASM
// This is marked as beta - Yaegi WASM support is experimental

self.GoRunner = {
  available: false,

  async init() {
    // Yaegi WASM is experimental and may not be available
    // For now, provide a clear message
    self.GoRunner.available = false;
    throw new Error(
      'Go execution is coming soon. ' +
      'The Yaegi Go interpreter WASM build is experimental. ' +
      'Please use JavaScript, Python, TypeScript, or C++ for now.'
    );
  },

  async runTests(code, problemDef) {
    if (!self.GoRunner.available) {
      return problemDef.testCases.map(function(tc, i) {
        return {
          testIndex: i,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: null,
          error: 'Go execution is not yet available. Coming soon!',
          executionTimeMs: 0
        };
      });
    }
  }
};
