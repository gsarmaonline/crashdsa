// comparison.js - Test case comparison utilities
// Loaded in Web Worker via importScripts

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function deepEqual(actual, expected, orderMatters) {
  if (orderMatters === undefined) orderMatters = true;

  // Strict equality
  if (actual === expected) return true;

  // Null/undefined checks
  if (actual == null || expected == null) return false;

  // Boolean comparison (handle Python True/False → JS true/false)
  if (typeof actual === 'boolean' || typeof expected === 'boolean') {
    return actual === expected;
  }

  // Floating point comparison
  if (typeof actual === 'number' && typeof expected === 'number') {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
    return Math.abs(actual - expected) < 1e-6;
  }

  // String comparison
  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual === expected;
  }

  // Array comparison
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;

    if (!orderMatters) {
      var sortedActual = actual.slice().sort(compareValues);
      var sortedExpected = expected.slice().sort(compareValues);
      for (var i = 0; i < sortedActual.length; i++) {
        if (!deepEqual(sortedActual[i], sortedExpected[i], true)) return false;
      }
      return true;
    }

    for (var j = 0; j < actual.length; j++) {
      if (!deepEqual(actual[j], expected[j], true)) return false;
    }
    return true;
  }

  // Object comparison (for nested structures)
  if (typeof actual === 'object' && typeof expected === 'object') {
    var keysA = Object.keys(actual);
    var keysB = Object.keys(expected);
    if (keysA.length !== keysB.length) return false;
    for (var k = 0; k < keysA.length; k++) {
      var key = keysA[k];
      if (!deepEqual(actual[key], expected[key], orderMatters)) return false;
    }
    return true;
  }

  return actual === expected;
}

// Export for Web Worker
if (typeof self !== 'undefined') {
  self.deepEqual = deepEqual;
}
