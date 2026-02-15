import { Layout } from '../components/Layout'
import type { FC } from 'hono/jsx'

export const Home: FC = () => {
  return (
    <Layout title="CrashDSA - Home">
      <div class="container hero">
        <h1>Welcome to CrashDSA</h1>
        <p class="subtitle">
          Master Data Structures & Algorithms with interactive problems and solutions
        </p>

        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Comprehensive Problems</h3>
            <p>Curated collection of DSA problems from easy to hard</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>Step-by-Step Solutions</h3>
            <p>Detailed explanations and multiple solution approaches</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Fast & Lightweight</h3>
            <p>Built with Hono and Bun for blazing fast performance</p>
          </div>
        </div>

        <div class="cta">
          <a href="/problems" class="btn btn-primary">Start Learning</a>
          <a href="/api-docs" class="btn btn-secondary">View API Docs</a>
        </div>
      </div>
    </Layout>
  )
}
