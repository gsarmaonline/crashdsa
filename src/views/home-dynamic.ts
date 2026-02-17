import { html, raw } from 'hono/html'
import { getStats, getPatternProblems } from '../data/problem-repository.js'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export async function homePageDynamic(user: User | null = null) {
  const [stats, allPatterns] = await Promise.all([getStats(), getPatternProblems()])
  const patternNames = allPatterns.map(p => p.name)

  // Pick 6 featured patterns with problem counts
  const featuredPatternNames = ['two-pointers', 'sliding-window', 'binary-search', 'tree-dfs', 'dynamic-programming-1d', 'backtracking']
  const featuredPatterns = featuredPatternNames
    .map(name => {
      const pattern = allPatterns.find(p => p.name === name)
      return pattern ? { ...pattern, count: pattern.problems.length } : null
    })
    .filter(Boolean) as { name: string; displayName: string; description: string; count: number }[]

  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrashDSA - DSA Interview Prep for Senior Engineers</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container hero">
      <h1>DSA Interview Prep for Senior Engineers</h1>
      <p class="tagline">Master the pattern, solve any problem.</p>
      <p class="subtitle">
        You already know how to code. Every interview question is a variation of ${patternNames.length} core patterns. Learn to recognize them, and no problem is new.
      </p>
      <div class="hero-stats">
        <div class="stat stat-featured">
          <div class="stat-number">${patternNames.length}</div>
          <div class="stat-label">Solution Patterns</div>
        </div>
        <div class="stat">
          <div class="stat-number">5</div>
          <div class="stat-label">Sheets Consolidated</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.total}</div>
          <div class="stat-label">Practice Problems</div>
        </div>
      </div>

      <div class="how-it-works">
        <div class="how-step">
          <div class="how-step-number">1</div>
          <div class="how-step-text">Learn the Pattern</div>
        </div>
        <div class="how-arrow">&rarr;</div>
        <div class="how-step">
          <div class="how-step-number">2</div>
          <div class="how-step-text">Practice Targeted Problems</div>
        </div>
        <div class="how-arrow">&rarr;</div>
        <div class="how-step">
          <div class="how-step-number">3</div>
          <div class="how-step-text">Recognize It in Any Interview</div>
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="container">
        <h2 class="section-title">Built for Engineers Who Ship Production Code</h2>
        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Pattern-First Approach</h3>
            <p>${patternNames.length} solution patterns that map to how senior interviews actually test you — learn the strategy, not just the solution</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>5 Sheets, One Place</h3>
            <p>Consolidated from NeetCode 150, Blind 75, LeetCode Top 150, Grind 75, and Striver's A2Z — deduplicated and pattern-tagged</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Blazing Fast</h3>
            <p>Built with Hono and Bun for ultra-fast performance and instant page loads</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Smart Deduplication</h3>
            <p>Deduplicated problems across multiple sheets to focus on unique challenges</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔌</div>
            <h3>RESTful API</h3>
            <p>Full API access with OpenAPI documentation for integrations</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>Study Groups</h3>
            <p>Create private groups with friends, share invite codes, and track each other's progress to stay motivated</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>Learn anywhere - desktop, tablet, or mobile device</p>
          </div>
        </div>
      </div>
    </section>

    <section id="patterns" class="problems-section">
      <div class="container">
        <h2 class="section-title">${patternNames.length} Patterns. That's All You Need.</h2>
        <p class="section-subtitle">Every interview question maps to one of these core strategies</p>

        <div class="problems-grid">
          ${raw(featuredPatterns.map(pattern => `
            <div class="problem-card">
              <div class="problem-header">
                <h3>${pattern.displayName}</h3>
                <span class="badge badge-medium">${pattern.count} problems</span>
              </div>
              <div class="problem-body">
                <p class="problem-description">${pattern.description}</p>
              </div>
              <div class="problem-footer">
                <a href="/problems?pattern=${pattern.name}" class="btn btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                  Explore Pattern
                </a>
              </div>
            </div>
          `).join(''))}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="/patterns" class="btn btn-primary">View All ${patternNames.length} Patterns</a>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2>Ready to Land Your Next Senior Role?</h2>
        <p>Stop grinding random problems. Start mastering the ${patternNames.length} patterns that actually repeat.</p>
        <div class="cta">
          <a href="/patterns" class="btn btn-primary">Explore Patterns</a>
          <a href="/problems" class="btn btn-secondary">Browse Problems</a>
          <a href="/groups" class="btn btn-secondary">Study Groups</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>© 2026 CrashDSA - DSA Interview Prep for Senior Engineers</p>
      <p>Built with ❤️ using Hono + Bun</p>
    </div>
  </footer>
</body>
</html>
`
}
