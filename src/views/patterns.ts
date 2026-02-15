import { html, raw } from 'hono/html'
import { getProblemsCache } from '../data/csv-loader.js'
import { PATTERNS } from '../dsa-sheets/patterns.js'

export function patternsPage() {
  const cache = getProblemsCache()

  const patternCards = PATTERNS.map(pattern => {
    const problems = cache.byPattern[pattern.name] || []
    const easy = problems.filter(p => p.difficulty === 'Easy').length
    const medium = problems.filter(p => p.difficulty === 'Medium').length
    const hard = problems.filter(p => p.difficulty === 'Hard').length
    const total = problems.length

    return { ...pattern, easy, medium, hard, total }
  })

  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patterns - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .patterns-header {
      margin-bottom: 2rem;
    }

    .patterns-header h1 {
      margin-bottom: 0.5rem;
    }

    .patterns-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .pattern-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .pattern-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .pattern-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.15rem;
      color: #1f2937;
    }

    .pattern-card .description {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1rem;
      flex: 1;
    }

    .pattern-stats {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: auto;
    }

    .pattern-total {
      font-weight: 700;
      font-size: 1.1rem;
      color: #1f2937;
    }

    .difficulty-pills {
      display: flex;
      gap: 0.4rem;
    }

    .diff-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .diff-pill.easy {
      background: #d1fae5;
      color: #065f46;
    }

    .diff-pill.medium {
      background: #fef3c7;
      color: #92400e;
    }

    .diff-pill.hard {
      background: #fee2e2;
      color: #991b1b;
    }

    .difficulty-bar {
      display: flex;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.75rem;
      background: #f3f4f6;
    }

    .difficulty-bar .bar-easy {
      background: #10b981;
    }

    .difficulty-bar .bar-medium {
      background: #f59e0b;
    }

    .difficulty-bar .bar-hard {
      background: #ef4444;
    }

    .patterns-summary {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .summary-stat {
      font-size: 0.95rem;
      color: #6b7280;
    }

    .summary-stat strong {
      color: #1f2937;
    }

    @media (max-width: 768px) {
      .patterns-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <a href="/">🚀 CrashDSA</a>
      </div>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/problems">Problems</a>
        <a href="/patterns">Patterns</a>
        <a href="/api-docs" target="_blank">API Docs</a>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <section class="container">
      <div class="patterns-header">
        <h1>Solution Patterns</h1>
        <p class="subtitle">
          Master ${PATTERNS.length} algorithmic strategies used to solve DSA problems
        </p>
        <div class="patterns-summary">
          <span class="summary-stat"><strong>${cache.stats.total}</strong> total problems</span>
          <span class="summary-stat"><strong>${PATTERNS.length}</strong> patterns</span>
        </div>
      </div>

      <div class="patterns-grid">
        ${raw(patternCards.map(p => `
          <a href="/problems?pattern=${p.name}" class="pattern-card">
            <h3>${p.displayName}</h3>
            <p class="description">${p.description}</p>
            <div class="pattern-stats">
              <span class="pattern-total">${p.total} problems</span>
              <div class="difficulty-pills">
                ${p.easy ? `<span class="diff-pill easy">${p.easy}E</span>` : ''}
                ${p.medium ? `<span class="diff-pill medium">${p.medium}M</span>` : ''}
                ${p.hard ? `<span class="diff-pill hard">${p.hard}H</span>` : ''}
              </div>
            </div>
            ${p.total > 0 ? `
              <div class="difficulty-bar">
                <div class="bar-easy" style="width: ${(p.easy / p.total * 100).toFixed(1)}%"></div>
                <div class="bar-medium" style="width: ${(p.medium / p.total * 100).toFixed(1)}%"></div>
                <div class="bar-hard" style="width: ${(p.hard / p.total * 100).toFixed(1)}%"></div>
              </div>
            ` : ''}
          </a>
        `).join(''))}
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 CrashDSA - Master Data Structures & Algorithms</p>
      <p>Built with ❤️ using Hono + Bun</p>
    </div>
  </footer>
</body>
</html>
`
}
