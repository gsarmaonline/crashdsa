// judge-worker.js - Web Worker that loads language runtimes and runs test cases

var runners = {};

importScripts('/judge/comparison.js');

async function getRunner(language) {
  if (runners[language]) return runners[language];

  self.postMessage({ type: 'RUNTIME_LOADING', language: language });

  switch (language) {
    case 'javascript':
      importScripts('/judge/runners/javascript-runner.js');
      runners[language] = self.JavaScriptRunner;
      break;

    case 'typescript':
      // Ensure JS runner is loaded first (TS runner depends on it)
      if (!self.JavaScriptRunner) {
        importScripts('/judge/runners/javascript-runner.js');
        runners['javascript'] = self.JavaScriptRunner;
      }
      importScripts('/judge/runners/typescript-runner.js');
      await self.TypeScriptRunner.init();
      runners[language] = self.TypeScriptRunner;
      break;

    case 'python':
      importScripts('/judge/runners/python-runner.js');
      await self.PythonRunner.init();
      runners[language] = self.PythonRunner;
      break;

    case 'cpp':
      importScripts('/judge/runners/cpp-runner.js');
      await self.CppRunner.init();
      runners[language] = self.CppRunner;
      break;

    case 'go':
      importScripts('/judge/runners/go-runner.js');
      await self.GoRunner.init();
      runners[language] = self.GoRunner;
      break;

    default:
      throw new Error('Unsupported language: ' + language);
  }

  self.postMessage({ type: 'RUNTIME_READY', language: language });
  return runners[language];
}

self.onmessage = async function(e) {
  var msg = e.data;

  if (msg.type === 'RUN_TESTS') {
    try {
      var runner = await getRunner(msg.payload.language);
      var results = await runner.runTests(msg.payload.code, msg.payload.problemDef);
      self.postMessage({
        type: 'TEST_RESULT',
        id: msg.id,
        results: results
      });
    } catch (err) {
      self.postMessage({
        type: 'ERROR',
        id: msg.id,
        error: err.message || String(err)
      });
    }
  }
};
