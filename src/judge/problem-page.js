// problem-page.js - Page orchestrator for the problem detail page
// Loaded as ES module: handles CodeMirror init, language switching, judge interaction

(async function() {
  var SLUG = window.__PROBLEM_SLUG__;
  var problemDef = null;
  var editorView = null;
  var currentLanguage = 'javascript';
  var codeCache = {}; // Cache code per language

  // --- CodeMirror Setup ---

  var CM_BASE = 'https://esm.sh';

  // Dynamic import helpers
  async function loadCodeMirror() {
    var [
      { EditorView, basicSetup },
      { EditorState },
      { keymap },
      { indentWithTab },
      jsLang,
      pyLang,
      cppLang
    ] = await Promise.all([
      import(CM_BASE + '/codemirror@6.0.1'),
      import(CM_BASE + '/@codemirror/state@6'),
      import(CM_BASE + '/@codemirror/view@6'),
      import(CM_BASE + '/@codemirror/commands@6'),
      import(CM_BASE + '/@codemirror/lang-javascript@6'),
      import(CM_BASE + '/@codemirror/lang-python@6'),
      import(CM_BASE + '/@codemirror/lang-cpp@6')
    ]);

    window.__CM = {
      EditorView: EditorView,
      EditorState: EditorState,
      basicSetup: basicSetup,
      keymap: keymap,
      indentWithTab: indentWithTab,
      languages: {
        javascript: jsLang.javascript(),
        typescript: jsLang.javascript({ typescript: true }),
        python: pyLang.python(),
        cpp: cppLang.cpp(),
        go: cppLang.cpp() // Fallback: Go syntax is close enough to C for highlighting
      }
    };
    return window.__CM;
  }

  function createEditor(container, code, language) {
    var CM = window.__CM;
    var langExt = CM.languages[language] || CM.languages.javascript;

    var state = CM.EditorState.create({
      doc: code,
      extensions: [
        CM.basicSetup,
        CM.keymap.of([CM.indentWithTab]),
        langExt,
        CM.EditorView.theme({
          '&': { fontSize: '14px' },
          '.cm-content': { fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace" },
          '.cm-gutters': { background: '#f8f9fa', borderRight: '1px solid #e5e7eb' }
        })
      ]
    });

    return new CM.EditorView({
      state: state,
      parent: container
    });
  }

  function getEditorCode() {
    return editorView ? editorView.state.doc.toString() : '';
  }

  function setEditorCode(code) {
    if (!editorView) return;
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: code }
    });
  }

  // --- Problem Loading ---

  async function loadProblem() {
    var resp = await fetch('/api/problems/' + SLUG + '/judge');
    if (!resp.ok) {
      document.getElementById('problem-description').innerHTML =
        '<p style="color:#ef4444">Problem definition not found. This problem does not have judge support yet.</p>';
      return null;
    }
    return resp.json();
  }

  function renderProblemDescription(def) {
    var panel = document.getElementById('problem-description');
    var html = '';

    // Description (render backtick code inline)
    html += '<div class="problem-description">';
    html += '<p>' + escapeHtml(def.description).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g, '<br>') + '</p>';
    html += '</div>';

    // Examples
    html += '<h3 style="margin-top:1.25rem">Examples</h3>';
    for (var i = 0; i < def.examples.length; i++) {
      var ex = def.examples[i];
      html += '<div class="example-block">';
      html += '<strong>Example ' + (i + 1) + '</strong>';
      html += '<div class="example-io"><strong>Input:</strong> ' + escapeHtml(ex.input) + '</div>';
      html += '<div class="example-io"><strong>Output:</strong> ' + escapeHtml(ex.output) + '</div>';
      if (ex.explanation) {
        html += '<div class="example-io"><strong>Explanation:</strong> ' + escapeHtml(ex.explanation) + '</div>';
      }
      html += '</div>';
    }

    // Constraints
    if (def.constraints && def.constraints.length > 0) {
      html += '<h3 style="margin-top:1.25rem">Constraints</h3>';
      html += '<ul class="constraints-list">';
      for (var j = 0; j < def.constraints.length; j++) {
        html += '<li>' + escapeHtml(def.constraints[j]).replace(/`([^`]+)`/g, '<code>$1</code>') + '</li>';
      }
      html += '</ul>';
    }

    panel.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Language Switching ---

  function switchLanguage(newLang) {
    // Save current code
    codeCache[currentLanguage] = getEditorCode();

    currentLanguage = newLang;

    // Load cached code or starter code
    var code = codeCache[newLang] || (problemDef && problemDef.starterCode[newLang]) || '// No starter code available';
    setEditorCode(code);

    // Recreate editor with new language mode
    var container = document.getElementById('code-editor');
    if (editorView) {
      var currentCode = getEditorCode();
      editorView.destroy();
      editorView = createEditor(container, currentCode, newLang);
    }
  }

  // --- Test Results Rendering ---

  function renderTestResults(results) {
    var panel = document.getElementById('test-results');
    var passed = results.filter(function(r) { return r.passed; }).length;
    var total = results.length;
    var allPassed = passed === total;

    var html = '<h3>Test Results</h3>';
    html += '<div class="test-results-summary ' + (allPassed ? 'all-passed' : 'some-failed') + '">';
    html += (allPassed ? 'All tests passed!' : passed + '/' + total + ' tests passed');
    html += '</div>';

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      html += '<div class="test-result-item ' + (r.passed ? 'passed' : 'failed') + '">';
      html += '<div class="test-result-header">';
      html += '<span>' + (r.passed ? 'Pass' : 'Fail') + ' - Test ' + (i + 1) + '</span>';
      html += '<span class="test-result-time">' + r.executionTimeMs + 'ms</span>';
      html += '</div>';

      html += '<div class="test-result-detail">';
      html += 'Input: ' + JSON.stringify(r.input) + '\n';
      html += 'Expected: ' + JSON.stringify(r.expected);
      if (!r.passed) {
        if (r.error) {
          html += '\nError: ' + escapeHtml(r.error);
        } else {
          html += '\nActual: ' + JSON.stringify(r.actual);
        }
      }
      html += '</div>';
      html += '</div>';
    }

    panel.innerHTML = html;
  }

  function renderError(message) {
    var panel = document.getElementById('test-results');
    panel.innerHTML = '<h3>Test Results</h3>' +
      '<div class="test-results-summary some-failed">' + escapeHtml(message) + '</div>';
  }

  // --- Console Output ---

  function logToConsole(message, type) {
    var panel = document.getElementById('console-output');
    var line = document.createElement('div');
    line.className = 'console-line' + (type ? ' console-' + type : '');
    line.textContent = message;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  }

  function clearConsole() {
    document.getElementById('console-output').innerHTML = '';
  }

  // --- Solved Banner ---

  function showSolvedBanner() {
    var banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:1rem;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    banner.textContent = 'Problem Solved!';
    document.body.appendChild(banner);
    setTimeout(function() { banner.remove(); }, 3000);
  }

  // --- Run / Submit ---

  async function runTests() {
    var runBtn = document.getElementById('run-btn');
    var submitBtn = document.getElementById('submit-btn');
    runBtn.disabled = true;
    submitBtn.disabled = true;
    runBtn.textContent = 'Running...';
    clearConsole();
    document.getElementById('test-results').innerHTML = '';

    logToConsole('Running tests with ' + currentLanguage + '...', 'info');

    try {
      var code = getEditorCode();
      var results = await window.JudgeClient.runTests(code, currentLanguage, problemDef);
      var passed = results.filter(function(r) { return r.passed; }).length;
      logToConsole(passed + '/' + results.length + ' tests passed', passed === results.length ? 'success' : 'error');
      renderTestResults(results);

      // Auto-mark as solved when all tests pass
      if (passed === results.length && results.length > 0) {
        fetch('/api/problems/' + SLUG + '/solve', { method: 'POST' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.firstSolve) {
              showSolvedBanner();
            }
          })
          .catch(function() {}); // Silently fail - solving is best-effort
      }
    } catch (err) {
      logToConsole('Error: ' + err.message, 'error');
      renderError(err.message);
    } finally {
      runBtn.disabled = false;
      submitBtn.disabled = false;
      runBtn.textContent = 'Run';
    }
  }

  // --- Resize Handle ---

  function initResizer() {
    var handle = document.getElementById('resize-handle');
    var left = document.querySelector('.judge-left');
    var layout = document.querySelector('.judge-layout');
    var isResizing = false;

    handle.addEventListener('mousedown', function(e) {
      isResizing = true;
      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;
      var rect = layout.getBoundingClientRect();
      var pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (pct > 20 && pct < 70) {
        left.style.width = pct + '%';
      }
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // --- Runtime Loading Indicator ---

  function initLoadingIndicator() {
    var indicator = document.getElementById('loading-indicator');

    document.addEventListener('judge:loading', function(e) {
      var langNames = {
        javascript: 'JavaScript', python: 'Python', typescript: 'TypeScript',
        cpp: 'C/C++', go: 'Go'
      };
      indicator.innerHTML = '<div class="runtime-loading"><div class="spinner"></div> Loading ' +
        (langNames[e.detail.language] || e.detail.language) + ' runtime...</div>';
    });

    document.addEventListener('judge:ready', function() {
      indicator.innerHTML = '';
    });
  }

  // --- Initialization ---

  async function main() {
    // Initialize judge client
    window.JudgeClient.init();

    // Load problem definition
    problemDef = await loadProblem();
    if (!problemDef) return;

    renderProblemDescription(problemDef);

    // Initialize starter code cache
    var langs = Object.keys(problemDef.starterCode);
    for (var i = 0; i < langs.length; i++) {
      codeCache[langs[i]] = problemDef.starterCode[langs[i]];
    }

    // Load CodeMirror
    logToConsole('Loading editor...', 'info');
    await loadCodeMirror();

    // Create editor with initial language
    var container = document.getElementById('code-editor');
    var initialCode = problemDef.starterCode[currentLanguage] || '';
    editorView = createEditor(container, initialCode, currentLanguage);
    clearConsole();

    // Wire up language selector
    var langSelect = document.getElementById('language-select');
    langSelect.addEventListener('change', function() {
      switchLanguage(langSelect.value);
    });

    // Wire up buttons
    document.getElementById('run-btn').addEventListener('click', runTests);
    document.getElementById('submit-btn').addEventListener('click', runTests);

    // Keyboard shortcuts: Cmd+' to Run, Cmd+Enter to Submit
    document.addEventListener('keydown', function(e) {
      if (e.metaKey && e.key === "'") {
        e.preventDefault();
        runTests();
      } else if (e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        runTests();
      }
    });

    // Initialize resize and loading indicator
    initResizer();
    initLoadingIndicator();
  }

  main().catch(function(err) {
    console.error('[CrashDSA] Init error:', err);
  });
})();
