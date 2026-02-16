// judge-client.js - Main thread API for communicating with the judge Web Worker

(function() {
  var worker = null;
  var pendingCallbacks = {};
  var callId = 0;

  function init() {
    if (worker) {
      worker.terminate();
    }
    worker = new Worker('/judge/judge-worker.js');
    worker.onmessage = handleMessage;
    worker.onerror = function(err) {
      console.error('[Judge] Worker error:', err);
    };
  }

  function handleMessage(e) {
    var msg = e.data;

    if (msg.type === 'RUNTIME_LOADING') {
      document.dispatchEvent(new CustomEvent('judge:loading', {
        detail: { language: msg.language }
      }));
      return;
    }

    if (msg.type === 'RUNTIME_READY') {
      document.dispatchEvent(new CustomEvent('judge:ready', {
        detail: { language: msg.language }
      }));
      return;
    }

    if (msg.type === 'TEST_RESULT' || msg.type === 'ERROR') {
      var cb = pendingCallbacks[msg.id];
      if (cb) {
        clearTimeout(cb.timeout);
        delete pendingCallbacks[msg.id];
        if (msg.type === 'ERROR') {
          cb.reject(new Error(msg.error));
        } else {
          cb.resolve(msg.results);
        }
      }
    }
  }

  function runTests(code, language, problemDef) {
    if (!worker) init();

    var id = ++callId;
    return new Promise(function(resolve, reject) {
      var timeoutHandle = setTimeout(function() {
        delete pendingCallbacks[id];
        reject(new Error('Execution timed out (10s). Possible infinite loop?'));
        // Terminate and recreate worker to recover
        worker.terminate();
        worker = null;
        init();
      }, 10000);

      pendingCallbacks[id] = {
        resolve: resolve,
        reject: reject,
        timeout: timeoutHandle
      };

      worker.postMessage({
        type: 'RUN_TESTS',
        id: id,
        payload: {
          code: code,
          language: language,
          problemDef: problemDef
        }
      });
    });
  }

  // Expose globally
  window.JudgeClient = {
    init: init,
    runTests: runTests
  };
})();
