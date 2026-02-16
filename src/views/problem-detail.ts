import { html, raw } from 'hono/html'
import type { Problem } from '../data/problem-repository.js'
import type { User } from '../db/users.js'
import { navbar } from '../components/navbar.js'

interface ProblemWithSlug extends Problem {
  slug: string
}

export function problemDetailPage(problem: ProblemWithSlug, user: User | null = null) {
  const difficultyClass = problem.difficulty.toLowerCase()

  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${problem.name} - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/judge/editor.css">
</head>
<body class="problem-detail-body">
  ${raw(navbar(user))}

  <div class="judge-layout">
    <div class="judge-left">
      <div class="problem-header">
        <h1>${problem.name}</h1>
        <div class="problem-meta">
          <span class="badge badge-${difficultyClass}">${problem.difficulty}</span>
          ${raw(problem.patterns.map(p =>
            `<span class="badge" style="background:#e0e7ff;color:#3730a3">${p}</span>`
          ).join(' '))}
          <a href="${problem.link}" target="_blank" rel="noopener" style="font-size:0.85rem;color:#6366f1">View on LeetCode</a>
        </div>
      </div>
      <div id="problem-description">
        <p style="color:#6b7280">Loading problem description...</p>
      </div>
      <div id="test-results"></div>
    </div>

    <div class="judge-divider" id="resize-handle"></div>

    <div class="judge-right">
      <div class="editor-toolbar">
        <select id="language-select">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="cpp">C / C++</option>
          <option value="go" disabled>Go (coming soon)</option>
        </select>
        <div id="loading-indicator"></div>
        <div class="editor-actions">
          <button id="run-btn" class="btn btn-secondary btn-small">Run</button>
          <button id="submit-btn" class="btn btn-primary btn-small">Submit</button>
        </div>
      </div>
      <div id="code-editor"></div>
      <div id="console-output" class="console-panel"></div>
    </div>
  </div>

  <script>window.__PROBLEM_SLUG__ = '${problem.slug}';</script>
  <script src="/judge/judge-client.js"></script>
  <script type="module" src="/judge/problem-page.js"></script>
</body>
</html>`
}
