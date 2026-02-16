// python-runner.js - Executes Python code via Pyodide in Web Worker

function pythonRepr(value) {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(pythonRepr).join(', ') + ']';
  }
  if (typeof value === 'object') {
    var entries = Object.entries(value).map(function(kv) {
      return JSON.stringify(kv[0]) + ': ' + pythonRepr(kv[1]);
    });
    return '{' + entries.join(', ') + '}';
  }
  return String(value);
}

function pyToJs(value) {
  if (value == null) return null;
  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  if (typeof value.toJs === 'function') {
    var converted = value.toJs({ dict_converter: Object.fromEntries });
    // Convert Map to plain object if needed
    if (converted instanceof Map) {
      return Object.fromEntries(converted);
    }
    return converted;
  }
  return value;
}

self.PythonRunner = {
  pyodide: null,

  async init() {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js');
    self.PythonRunner.pyodide = await loadPyodide();
  },

  async runTests(code, problemDef) {
    var pyodide = self.PythonRunner.pyodide;
    var results = [];
    var fnName = problemDef.functionNameMap.python;

    for (var i = 0; i < problemDef.testCases.length; i++) {
      var tc = problemDef.testCases[i];
      var start = performance.now();
      try {
        // Build Python code: user code + call with test inputs
        var paramNames = problemDef.function.params.map(function(p) { return p.name; });
        var argAssignments = paramNames.map(function(name) {
          return name + ' = ' + pythonRepr(tc.input[name]);
        }).join('\n');

        var fullCode = code + '\n\n' + argAssignments + '\n__result__ = ' + fnName + '(' + paramNames.join(', ') + ')';

        pyodide.runPython(fullCode);
        var rawResult = pyodide.globals.get('__result__');
        var actual = pyToJs(rawResult);
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
