import { html, raw } from 'hono/html'
import { getProblemsCache } from '../data/csv-loader.js'

export function homePageDynamic() {
  const cache = getProblemsCache()
  const { stats, patterns } = cache

  // Get a sample of problems for featured section
  const featuredProblems = cache.all.slice(0, 6)

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
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <a href="/">🚀 CrashDSA</a>
      </div>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/problems">Problems</a>
        <a href="/patterns">Patterns</a>
        <a href="#features">Features</a>
        <a href="/api-docs" target="_blank">API Docs</a>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <section class="container hero">
      <h1>DSA Interview Prep for Senior Engineers</h1>
      <p class="tagline">Less is more.</p>
      <p class="subtitle">
        You already know how to code. Now crush the interview. ${stats.total} curated problems from top prep sheets, organized by solution pattern — built for experienced engineers.
      </p>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-number">${stats.total}</div>
          <div class="stat-label">Problems</div>
        </div>
        <div class="stat">
          <div class="stat-number">${patterns.length}</div>
          <div class="stat-label">Patterns</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.easy}</div>
          <div class="stat-label">Easy</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.medium}</div>
          <div class="stat-label">Medium</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.hard}</div>
          <div class="stat-label">Hard</div>
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="container">
        <h2 class="section-title">Built for Engineers Who Ship Production Code</h2>
        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Senior-Level Curation</h3>
            <p>${stats.total} problems hand-picked from NeetCode 150, Blind 75, LeetCode Top 150, Grind 75, and Striver's A2Z — no beginner fluff</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Pattern-Based Learning</h3>
            <p>${patterns.length} solution patterns that map to how senior interviews actually test you — not textbook chapter order</p>
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
            <div class="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>Learn anywhere - desktop, tablet, or mobile device</p>
          </div>
        </div>
      </div>
    </section>

    <section id="problems" class="problems-section">
      <div class="container">
        <h2 class="section-title">Featured Problems</h2>
        <p class="section-subtitle">The kind of problems you'll see in staff and senior loops</p>

        <div class="problems-grid">
          ${raw(featuredProblems.map(problem => `
            <div class="problem-card">
              <div class="problem-header">
                <h3>${problem.name}</h3>
                <span class="badge badge-${problem.difficulty.toLowerCase()}">${problem.difficulty}</span>
              </div>
              <div class="problem-body">
                <p class="problem-category"><strong>Patterns:</strong> ${problem.patterns.join(', ') || 'N/A'}</p>
                <p class="problem-category"><strong>Sources:</strong> ${problem.sourceSheets.join(', ')}</p>
              </div>
              <div class="problem-footer">
                <a href="${problem.link}" target="_blank" class="btn btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
                  Solve on LeetCode
                </a>
              </div>
            </div>
          `).join(''))}
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="/problems" class="btn btn-primary">View All ${stats.total} Problems</a>
        </div>
      </div>
    </section>

    <section class="tech-section">
      <div class="container">
        <h2 class="section-title">Built with Modern Tech</h2>
        <div class="tech-stack">
          <div class="tech-item">
            <div class="tech-name">Bun</div>
            <div class="tech-desc">Fast JavaScript runtime</div>
          </div>
          <div class="tech-item">
            <div class="tech-name">Hono</div>
            <div class="tech-desc">Lightweight web framework</div>
          </div>
          <div class="tech-item">
            <div class="tech-name">TypeScript</div>
            <div class="tech-desc">Type-safe development</div>
          </div>
          <div class="tech-item">
            <div class="tech-name">Server-Side</div>
            <div class="tech-desc">Fast rendering</div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2>Ready to Land Your Next Senior Role?</h2>
        <p>Skip the basics. Focus on the patterns that matter at the senior and staff level.</p>
        <div class="cta">
          <a href="/problems" class="btn btn-primary">Browse Problems</a>
          <a href="/api-docs" class="btn btn-secondary">View API Docs</a>
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
