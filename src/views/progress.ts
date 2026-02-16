import { html, raw } from 'hono/html'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export function progressPage(user: User | null = null) {
  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Progress - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    .progress-header {
      margin-bottom: 2rem;
    }

    .overall-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .stat-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      flex: 1;
      min-width: 150px;
      text-align: center;
    }

    .stat-card .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
    }

    .stat-card .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .progress-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .progress-section h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }

    .progress-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .progress-label {
      min-width: 140px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
    }

    .progress-bar-container {
      flex: 1;
      background: #f3f4f6;
      border-radius: 0.5rem;
      height: 1.25rem;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 0.5rem;
      transition: width 0.3s ease;
    }

    .progress-bar-fill.easy { background: #10b981; }
    .progress-bar-fill.medium { background: #f59e0b; }
    .progress-bar-fill.hard { background: #ef4444; }
    .progress-bar-fill.pattern { background: #3b82f6; }

    .progress-count {
      min-width: 60px;
      font-size: 0.85rem;
      color: #6b7280;
      text-align: right;
    }

    .recent-solves-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .recent-solve-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .recent-solve-item:last-child {
      border-bottom: none;
    }

    .recent-solve-slug {
      font-weight: 500;
      color: #3b82f6;
      text-decoration: none;
    }

    .recent-solve-slug:hover {
      text-decoration: underline;
    }

    .recent-solve-time {
      font-size: 0.85rem;
      color: #9ca3af;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }
  </style>
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container">
      <div class="progress-header">
        <h1>Your Progress</h1>
        <p class="subtitle">Track your DSA problem-solving journey</p>
      </div>

      <div id="progress-content">
        <div class="loading">Loading progress...</div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 CrashDSA - Master Data Structures &amp; Algorithms</p>
      <p>Built with &hearts; using Hono + Bun</p>
    </div>
  </footer>

  <script>
    async function loadProgress() {
      const container = document.getElementById('progress-content')
      try {
        const response = await fetch('/api/user/progress')
        const data = await response.json()
        renderProgress(data)
      } catch (error) {
        container.innerHTML = '<div class="error">Failed to load progress. Please try again later.</div>'
      }
    }

    function renderProgress(data) {
      const container = document.getElementById('progress-content')
      const pct = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0

      let html = ''

      // Overall stats
      html += '<div class="overall-stats">'
      html += statCard(data.solved, 'Solved')
      html += statCard(data.total, 'Total Problems')
      html += statCard(pct + '%', 'Completion')
      html += '</div>'

      // Difficulty breakdown
      html += '<div class="progress-section">'
      html += '<h2>By Difficulty</h2>'
      html += progressRow('Easy', data.byDifficulty.Easy.solved, data.byDifficulty.Easy.total, 'easy')
      html += progressRow('Medium', data.byDifficulty.Medium.solved, data.byDifficulty.Medium.total, 'medium')
      html += progressRow('Hard', data.byDifficulty.Hard.solved, data.byDifficulty.Hard.total, 'hard')
      html += '</div>'

      // Pattern breakdown
      html += '<div class="progress-section">'
      html += '<h2>By Pattern</h2>'
      const patternNames = data.patterns.map(function(p) { return p.name })
      patternNames.sort()
      for (let i = 0; i < patternNames.length; i++) {
        const name = patternNames[i]
        const stats = data.byPattern[name]
        if (stats) {
          const displayName = data.patterns.find(function(p) { return p.name === name })
          html += progressRow(displayName ? displayName.displayName : name, stats.solved, stats.total, 'pattern')
        }
      }
      html += '</div>'

      // Recent solves
      if (data.recentSolves.length > 0) {
        html += '<div class="progress-section">'
        html += '<h2>Recently Solved</h2>'
        html += '<ul class="recent-solves-list">'
        for (let i = 0; i < data.recentSolves.length; i++) {
          const solve = data.recentSolves[i]
          const date = new Date(solve.solved_at)
          const timeAgo = formatTimeAgo(date)
          html += '<li class="recent-solve-item">'
          html += '<a href="/problems/' + solve.problem_slug + '" class="recent-solve-slug">' + solve.problem_slug + '</a>'
          html += '<span class="recent-solve-time">' + timeAgo + '</span>'
          html += '</li>'
        }
        html += '</ul>'
        html += '</div>'
      }

      container.innerHTML = html
    }

    function statCard(value, label) {
      return '<div class="stat-card"><div class="stat-number">' + value + '</div><div class="stat-label">' + label + '</div></div>'
    }

    function progressRow(label, solved, total, colorClass) {
      const pct = total > 0 ? Math.round((solved / total) * 100) : 0
      return '<div class="progress-row">' +
        '<span class="progress-label">' + label + '</span>' +
        '<div class="progress-bar-container"><div class="progress-bar-fill ' + colorClass + '" style="width:' + pct + '%"></div></div>' +
        '<span class="progress-count">' + solved + '/' + total + '</span>' +
        '</div>'
    }

    function formatTimeAgo(date) {
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return diffMins + 'm ago'
      if (diffHours < 24) return diffHours + 'h ago'
      if (diffDays < 7) return diffDays + 'd ago'
      return date.toLocaleDateString()
    }

    loadProgress()
  </script>
</body>
</html>
`
}
