import { html } from 'hono/html'

export const problemsPage = html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Problems - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 600;
      font-size: 0.9rem;
      color: #374151;
    }

    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      background: white;
    }

    .filter-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-box {
      flex: 1;
      min-width: 250px;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .error {
      padding: 1rem;
      background: #fee2e2;
      color: #991b1b;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .problems-count {
      color: #6b7280;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .problem-link {
      color: inherit;
      text-decoration: none;
    }

    .problem-link:hover {
      color: #3b82f6;
    }

    .source-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .source-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
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
      <h1>DSA Problems</h1>
      <p class="subtitle">
        Explore our curated collection of data structures and algorithms problems
      </p>

      <div class="filters">
        <div class="filter-group">
          <label for="pattern-filter">Pattern</label>
          <select id="pattern-filter" class="filter-select">
            <option value="">All Patterns</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="difficulty-filter">Difficulty</label>
          <select id="difficulty-filter" class="filter-select">
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div class="filter-group search-box">
          <label for="search-input">Search</label>
          <input
            type="text"
            id="search-input"
            class="search-input"
            placeholder="Search problems..."
          />
        </div>
      </div>

      <div id="problems-count" class="problems-count"></div>
      <div id="problems-container" class="problems-grid">
        <div class="loading">Loading problems...</div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>© 2026 CrashDSA - Master Data Structures & Algorithms</p>
      <p>Built with ❤️ using Hono + Bun</p>
    </div>
  </footer>

  <script>
    let allProblems = []
    let allPatterns = []

    async function loadPatterns() {
      try {
        const response = await fetch('/api/patterns')
        const data = await response.json()
        allPatterns = data.patterns

        const select = document.getElementById('pattern-filter')
        data.patterns.forEach(pattern => {
          const option = document.createElement('option')
          option.value = pattern.name
          option.textContent = \`\${pattern.displayName} (\${pattern.count})\`
          select.appendChild(option)
        })
      } catch (error) {
        console.error('Error loading patterns:', error)
      }
    }

    async function loadProblems() {
      const container = document.getElementById('problems-container')
      container.innerHTML = '<div class="loading">Loading problems...</div>'

      try {
        const response = await fetch('/api/problems')
        const data = await response.json()
        allProblems = data.problems
        renderProblems(allProblems)
      } catch (error) {
        container.innerHTML = \`
          <div class="error">
            Failed to load problems. Please try again later.
          </div>
        \`
      }
    }

    function filterProblems() {
      const pattern = document.getElementById('pattern-filter').value
      const difficulty = document.getElementById('difficulty-filter').value
      const searchTerm = document.getElementById('search-input').value.toLowerCase()

      let filtered = allProblems

      if (pattern) {
        filtered = filtered.filter(p => p.patterns.includes(pattern))
      }

      if (difficulty) {
        filtered = filtered.filter(p => p.difficulty === difficulty)
      }

      if (searchTerm) {
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(searchTerm)
        )
      }

      renderProblems(filtered)
    }

    function renderProblems(problems) {
      const container = document.getElementById('problems-container')
      const countEl = document.getElementById('problems-count')

      countEl.textContent = \`Showing \${problems.length} problem\${problems.length !== 1 ? 's' : ''}\`

      if (problems.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <h3>No problems found</h3>
            <p>Try adjusting your filters</p>
          </div>
        \`
        return
      }

      container.innerHTML = problems.map(problem => \`
        <div class="problem-card">
          <div class="problem-header">
            <h3>
              <a href="\${problem.link}" target="_blank" class="problem-link">
                \${problem.name}
              </a>
            </h3>
            <span class="badge badge-\${problem.difficulty.toLowerCase()}">\${problem.difficulty}</span>
          </div>
          <div class="problem-body">
            <p class="problem-category">
              <strong>Patterns:</strong> \${problem.patterns.join(', ') || 'N/A'}
            </p>
            <div class="source-badges">
              \${problem.sourceSheets.map(source => \`
                <span class="source-badge">\${source}</span>
              \`).join('')}
            </div>
          </div>
          <div class="problem-footer">
            <a href="\${problem.link}" target="_blank" class="btn btn-secondary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">
              Solve on LeetCode
            </a>
          </div>
        </div>
      \`).join('')
    }

    // Event listeners
    document.getElementById('pattern-filter').addEventListener('change', filterProblems)
    document.getElementById('difficulty-filter').addEventListener('change', filterProblems)
    document.getElementById('search-input').addEventListener('input', filterProblems)

    // Initial load - apply URL pattern filter after both data sources are ready
    const urlParams = new URLSearchParams(window.location.search)
    const preselectedPattern = urlParams.get('pattern')

    Promise.all([loadPatterns(), loadProblems()]).then(() => {
      if (preselectedPattern) {
        document.getElementById('pattern-filter').value = preselectedPattern
        filterProblems()
      }
    })
  </script>
</body>
</html>
`
