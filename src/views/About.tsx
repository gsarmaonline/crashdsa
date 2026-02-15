import { Layout } from '../components/Layout'
import type { FC } from 'hono/jsx'

export const About: FC = () => {
  return (
    <Layout title="CrashDSA - About">
      <div class="container">
        <h1>About CrashDSA</h1>

        <div class="about-content">
          <section class="about-section">
            <h2>🎯 Our Mission</h2>
            <p>
              CrashDSA is designed to help developers master data structures and algorithms
              through interactive learning and practical problem-solving.
            </p>
          </section>

          <section class="about-section">
            <h2>⚡ Tech Stack</h2>
            <ul class="tech-list">
              <li><strong>Bun:</strong> Fast JavaScript runtime</li>
              <li><strong>Hono:</strong> Lightweight web framework</li>
              <li><strong>TypeScript:</strong> Type-safe development</li>
              <li><strong>Hono JSX:</strong> Server-side rendering</li>
            </ul>
          </section>

          <section class="about-section">
            <h2>🚀 Features</h2>
            <ul class="features-list">
              <li>Curated DSA problems from easy to hard</li>
              <li>Multiple solution approaches with explanations</li>
              <li>Time and space complexity analysis</li>
              <li>RESTful API for integration</li>
              <li>Interactive Swagger documentation</li>
            </ul>
          </section>

          <section class="about-section">
            <h2>📚 Learning Path</h2>
            <p>
              Start with easy problems to build fundamentals, then progress to medium
              and hard problems. Each problem includes detailed explanations and multiple
              solution approaches to deepen your understanding.
            </p>
          </section>
        </div>

        <div class="cta">
          <a href="/problems" class="btn btn-primary">Start Solving</a>
        </div>
      </div>
    </Layout>
  )
}
