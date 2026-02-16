// javascript-runner.js - Executes JavaScript code in Web Worker

self.JavaScriptRunner = {
  async init() {
    // No-op: JavaScript runs natively
  },

  async runTests(code, problemDef) {
    var results = [];
    var fnName = problemDef.functionNameMap.javascript;

    for (var i = 0; i < problemDef.testCases.length; i++) {
      var tc = problemDef.testCases[i];
      var start = performance.now();
      try {
        // Build argument list from test case input
        var paramNames = problemDef.function.params.map(function(p) { return p.name; });
        var args = paramNames.map(function(name) {
          return JSON.stringify(tc.input[name]);
        });

        // Wrap user code in a function scope and call it
        var wrapper = code + '\nreturn ' + fnName + '(' + args.join(', ') + ');';
        var fn = new Function(wrapper);
        var actual = fn();
        var elapsed = performance.now() - start;

        results.push({
          testIndex: i,
          passed: self.deepEqual(actual, tc.expected, tc.orderMatters !== false),
          input: tc.input,
          expected: tc.expected,
          actual: actual,
          error: null,
          executionTimeMs: Math.round(elapsed * 100) / 100
        });
      } catch (err) {
        results.push({
          testIndex: i,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: null,
          error: err.message,
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100
        });
      }
    }
    return results;
  }
};
