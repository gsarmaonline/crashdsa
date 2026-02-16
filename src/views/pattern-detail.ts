import { html, raw } from 'hono/html'
import { getProblemsByPattern, getPatternProblems } from '../data/problem-repository.js'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export async function patternDetailPage(
  name: string,
  user: User | null = null
): Promise<ReturnType<typeof html> | null> {
  const [result, allPatterns] = await Promise.all([
    getProblemsByPattern(name),
    getPatternProblems(),
  ])
  if (!result) return null

  const pattern = result
  const problems = result.problems ?? []

  const easy = problems.filter(p => p.difficulty === 'Easy')
  const medium = problems.filter(p => p.difficulty === 'Medium')
  const hard = problems.filter(p => p.difficulty === 'Hard')

  const patternIndex = allPatterns.findIndex(p => p.name === name)
  const prevPattern = patternIndex > 0 ? allPatterns[patternIndex - 1] : null
  const nextPattern = patternIndex < allPatterns.length - 1 ? allPatterns[patternIndex + 1] : null

  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pattern.displayName} - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    .back-link {
      display: inline-block;
      color: var(--primary);
      text-decoration: none;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .back-link:hover { text-decoration: underline; }

    .animation-container {
      background: white;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin: 1.5rem 0 2rem;
      text-align: center;
      overflow: hidden;
    }
    .animation-container img {
      max-width: 100%;
      height: auto;
    }

    .strategy-content {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem 2rem;
      margin-bottom: 2rem;
      line-height: 1.7;
      color: #1e293b;
      font-size: 0.95rem;
    }
    .strategy-content p {
      margin: 0.75rem 0;
    }
    .strategy-content p:first-child {
      margin-top: 0;
    }
    .strategy-section {
      margin: 1.25rem 0;
    }
    .strategy-section h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .strategy-section p {
      margin: 0;
    }

    .pattern-meta {
      display: flex;
      gap: 1.5rem;
      margin: 1.5rem 0;
      flex-wrap: wrap;
      align-items: center;
    }
    .meta-item {
      font-size: 0.95rem;
      color: #6b7280;
    }
    .meta-item strong {
      color: #1f2937;
      font-size: 1.1rem;
    }

    .keyword-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0.75rem 0 2rem;
    }
    .keyword-chip {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #f3f4f6;
      border-radius: 9999px;
      font-size: 0.8rem;
      color: #374151;
    }

    .problems-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.75rem;
    }
    .problems-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
      font-size: 0.85rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .problems-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
    }
    .problems-table tr:hover { background: #f9fafb; }
    .problem-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }
    .problem-link:hover { text-decoration: underline; }

    .source-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      background: #ede9fe;
      color: #5b21b6;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-right: 0.25rem;
    }

    .pattern-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    .pattern-nav a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
    }
    .pattern-nav a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .pattern-meta { gap: 0.75rem; }
      .problems-table { font-size: 0.85rem; }
      .problems-table th, .problems-table td { padding: 0.5rem; }
    }
  </style>
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container" style="padding-top: 2rem; padding-bottom: 3rem;">
      <a href="/patterns" class="back-link">&larr; All Patterns</a>
      <h1>${pattern.displayName}</h1>
      <p class="subtitle" style="color: #6b7280; font-size: 1.05rem; margin-top: 0.25rem;">
        ${pattern.description}
      </p>

      <div class="animation-container">
        <img src="/animations/${pattern.name}.svg" alt="${pattern.displayName} animation" />
      </div>

      <h2 style="font-size: 1.15rem; margin-bottom: 0.75rem;">Strategy Guide</h2>
      <div class="strategy-content">
        ${raw(pattern.strategy.split('\n\n').map(paragraph => {
          if (paragraph.startsWith('**') && paragraph.includes('**:')) {
            const boldEnd = paragraph.indexOf('**:', 2)
            const title = paragraph.slice(2, boldEnd)
            const rest = paragraph.slice(boldEnd + 3)
            return `<div class="strategy-section"><h3>${title}</h3><p>${rest.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p></div>`
          }
          return `<p>${paragraph.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`
        }).join(''))}
      </div>

      <div class="pattern-meta">
        <div class="meta-item"><strong>${problems.length}</strong> problems</div>
        <div class="meta-item"><span class="diff-pill easy">${easy.length} Easy</span></div>
        <div class="meta-item"><span class="diff-pill medium">${medium.length} Medium</span></div>
        <div class="meta-item"><span class="diff-pill hard">${hard.length} Hard</span></div>
      </div>

      <h2 style="font-size: 1.15rem; margin-bottom: 0.25rem;">Keywords</h2>
      <div class="keyword-chips">
        ${raw(pattern.keywords.map(k => `<span class="keyword-chip">${k}</span>`).join(''))}
      </div>

      <h2 style="font-size: 1.15rem;">Problems (${problems.length})</h2>
      ${problems.length > 0 ? raw(`
        <table class="problems-table">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Difficulty</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            ${problems.map(p => `
              <tr>
                <td><a href="/problems/${p.slug}" class="problem-link">${p.name}</a></td>
                <td><span class="badge badge-${p.difficulty.toLowerCase()}">${p.difficulty}</span></td>
                <td>${p.sourceSheets.map(s => `<span class="source-badge">${s}</span>`).join('')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `) : raw(`<p style="color: #6b7280;">No problems found for this pattern yet.</p>`)}

      <div class="pattern-nav">
        ${raw(prevPattern
          ? `<a href="/patterns/${prevPattern.name}">&larr; ${prevPattern.displayName}</a>`
          : '<span></span>'
        )}
        ${raw(nextPattern
          ? `<a href="/patterns/${nextPattern.name}">${nextPattern.displayName} &rarr;</a>`
          : '<span></span>'
        )}
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
