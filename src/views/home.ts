import { html } from 'hono/html'

export const homePage = html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CrashDSA - Master Data Structures & Algorithms</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <a href="/">🚀 CrashDSA</a>
      </div>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="#features">Features</a>
        <a href="#problems">Problems</a>
        <a href="/api-docs" target="_blank">API Docs</a>
      </div>
    </div>
  </nav>

  <main class="main-content">
    <section class="container hero">
      <h1>Welcome to CrashDSA</h1>
      <p class="subtitle">
        Master Data Structures & Algorithms with interactive problems and solutions
      </p>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-number">100+</div>
          <div class="stat-label">Problems</div>
        </div>
        <div class="stat">
          <div class="stat-number">10+</div>
          <div class="stat-label">Categories</div>
        </div>
        <div class="stat">
          <div class="stat-number">⚡</div>
          <div class="stat-label">Fast</div>
        </div>
      </div>
    </section>

    <section id="features" class="features-section">
      <div class="container">
        <h2 class="section-title">Why CrashDSA?</h2>
        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Comprehensive Problems</h3>
            <p>Curated collection of DSA problems from easy to hard, covering all essential topics</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>Step-by-Step Solutions</h3>
            <p>Detailed explanations with multiple approaches, time & space complexity analysis</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Blazing Fast</h3>
            <p>Built with Hono and Bun for ultra-fast performance and instant page loads</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Interview Ready</h3>
            <p>Practice problems similar to those asked in FAANG interviews</p>
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
        <p class="section-subtitle">Start with these popular problems</p>

        <div class="problems-grid">
          <div class="problem-card">
            <div class="problem-header">
              <h3>Two Sum</h3>
              <span class="badge badge-easy">Easy</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> Array, Hash Table</p>
              <p class="problem-description">
                Given an array of integers, return indices of two numbers that add up to a target sum.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n)</span>
                <span>💾 O(n)</span>
              </div>
            </div>
          </div>

          <div class="problem-card">
            <div class="problem-header">
              <h3>Valid Parentheses</h3>
              <span class="badge badge-easy">Easy</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> Stack, String</p>
              <p class="problem-description">
                Check if a string containing brackets is balanced and properly nested.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n)</span>
                <span>💾 O(n)</span>
              </div>
            </div>
          </div>

          <div class="problem-card">
            <div class="problem-header">
              <h3>Binary Tree Level Order</h3>
              <span class="badge badge-medium">Medium</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> Tree, BFS</p>
              <p class="problem-description">
                Traverse a binary tree level by level and return values as nested arrays.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n)</span>
                <span>💾 O(n)</span>
              </div>
            </div>
          </div>

          <div class="problem-card">
            <div class="problem-header">
              <h3>Longest Palindrome</h3>
              <span class="badge badge-medium">Medium</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> String, DP</p>
              <p class="problem-description">
                Find the longest palindromic substring in a given string efficiently.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n²)</span>
                <span>💾 O(1)</span>
              </div>
            </div>
          </div>

          <div class="problem-card">
            <div class="problem-header">
              <h3>Merge K Sorted Lists</h3>
              <span class="badge badge-hard">Hard</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> Linked List, Heap</p>
              <p class="problem-description">
                Merge k sorted linked lists into one sorted list using a min-heap.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n log k)</span>
                <span>💾 O(k)</span>
              </div>
            </div>
          </div>

          <div class="problem-card">
            <div class="problem-header">
              <h3>Trapping Rain Water</h3>
              <span class="badge badge-hard">Hard</span>
            </div>
            <div class="problem-body">
              <p class="problem-category"><strong>Category:</strong> Array, Two Pointers</p>
              <p class="problem-description">
                Calculate how much water can be trapped after raining using elevation map.
              </p>
            </div>
            <div class="problem-footer">
              <div class="problem-stats">
                <span>⏱️ O(n)</span>
                <span>💾 O(1)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2>Ready to Master DSA?</h2>
        <p>Start solving problems and prepare for your next technical interview</p>
        <div class="cta">
          <a href="#problems" class="btn btn-primary">Browse Problems</a>
          <a href="/api-docs" class="btn btn-secondary">View API Docs</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>© 2026 CrashDSA - Master Data Structures & Algorithms</p>
      <p>Built with ❤️ using Hono + Bun</p>
    </div>
  </footer>
</body>
</html>
`
