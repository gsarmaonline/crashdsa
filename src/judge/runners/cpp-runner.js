// cpp-runner.js - Executes C/C++ code via JSCPP interpreter in Web Worker

function cppValueLiteral(value, type) {
  if (type === 'string') return '"' + String(value).replace(/"/g, '\\"') + '"';
  if (type === 'bool') return value ? 'true' : 'false';
  if (type === 'int' || type === 'float') return String(value);
  return String(value);
}

function generateCppMain(userCode, fnName, funcDef, testCase) {
  var lines = [];
  lines.push('#include <iostream>');
  lines.push('#include <vector>');
  lines.push('#include <string>');
  lines.push('using namespace std;');
  lines.push('');
  lines.push(userCode);
  lines.push('');
  lines.push('int main() {');

  // Declare and initialize each parameter
  var callArgs = [];
  for (var i = 0; i < funcDef.params.length; i++) {
    var param = funcDef.params[i];
    var value = testCase.input[param.name];
    var varName = '_arg' + i;

    if (param.type === 'int[]') {
      lines.push('  vector<int> ' + varName + ' = {' + value.join(', ') + '};');
    } else if (param.type === 'string[]') {
      var strs = value.map(function(s) { return '"' + s + '"'; });
      lines.push('  vector<string> ' + varName + ' = {' + strs.join(', ') + '};');
    } else if (param.type === 'int') {
      lines.push('  int ' + varName + ' = ' + value + ';');
    } else if (param.type === 'float') {
      lines.push('  double ' + varName + ' = ' + value + ';');
    } else if (param.type === 'string') {
      lines.push('  string ' + varName + ' = "' + String(value).replace(/"/g, '\\"') + '";');
    } else if (param.type === 'bool') {
      lines.push('  bool ' + varName + ' = ' + (value ? 'true' : 'false') + ';');
    }
    callArgs.push(varName);
  }

  // Call function and print result
  var retType = funcDef.returnType;
  lines.push('  auto __result = ' + fnName + '(' + callArgs.join(', ') + ');');

  if (retType === 'int[]' || retType === 'string[]') {
    lines.push('  cout << "[";');
    lines.push('  for (int __i = 0; __i < __result.size(); __i++) {');
    lines.push('    if (__i > 0) cout << ",";');
    if (retType === 'string[]') {
      lines.push('    cout << "\\"" << __result[__i] << "\\"";');
    } else {
      lines.push('    cout << __result[__i];');
    }
    lines.push('  }');
    lines.push('  cout << "]" << endl;');
  } else if (retType === 'bool') {
    lines.push('  cout << (__result ? "true" : "false") << endl;');
  } else if (retType === 'int[][]') {
    lines.push('  cout << "[";');
    lines.push('  for (int __i = 0; __i < __result.size(); __i++) {');
    lines.push('    if (__i > 0) cout << ",";');
    lines.push('    cout << "[";');
    lines.push('    for (int __j = 0; __j < __result[__i].size(); __j++) {');
    lines.push('      if (__j > 0) cout << ",";');
    lines.push('      cout << __result[__i][__j];');
    lines.push('    }');
    lines.push('    cout << "]";');
    lines.push('  }');
    lines.push('  cout << "]" << endl;');
  } else {
    lines.push('  cout << __result << endl;');
  }

  lines.push('  return 0;');
  lines.push('}');
  return lines.join('\n');
}

function parseCppOutput(output, returnType) {
  output = output.trim();
  if (returnType === 'bool') {
    return output === 'true';
  }
  if (returnType === 'int') {
    return parseInt(output, 10);
  }
  if (returnType === 'float') {
    return parseFloat(output);
  }
  if (returnType === 'string') {
    // Remove surrounding quotes if present
    if (output.startsWith('"') && output.endsWith('"')) {
      return output.slice(1, -1);
    }
    return output;
  }
  // Array types: parse JSON-like output
  try {
    return JSON.parse(output);
  } catch (e) {
    return output;
  }
}

self.CppRunner = {
  jscpp: null,

  async init() {
    importScripts('https://cdn.jsdelivr.net/npm/JSCPP@2.0.2/dist/JSCPP.es5.min.js');
    self.CppRunner.jscpp = self.JSCPP;
  },

  async runTests(code, problemDef) {
    var results = [];
    var fnName = problemDef.functionNameMap.cpp;

    for (var i = 0; i < problemDef.testCases.length; i++) {
      var tc = problemDef.testCases[i];
      var start = performance.now();
      try {
        var mainCode = generateCppMain(code, fnName, problemDef.function, tc);
        var output = [];
        var config = {
          stdio: {
            write: function(s) { output.push(s); }
          }
        };
        self.CppRunner.jscpp.run(mainCode, '', config);
        var actual = parseCppOutput(output.join(''), problemDef.function.returnType);
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
