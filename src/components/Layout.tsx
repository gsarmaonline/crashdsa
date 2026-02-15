import { html } from 'hono/html'
import type { FC } from 'hono/jsx'

type LayoutProps = {
  title?: string
  children: any
}

export const Layout: FC<LayoutProps> = ({ title = 'CrashDSA', children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/styles.css" />
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
              <a href="/about">About</a>
              <a href="/api-docs" target="_blank">API Docs</a>
            </div>
          </div>
        </nav>
        <main class="main-content">
          {children}
        </main>
        <footer class="footer">
          <div class="container">
            <p>© 2026 CrashDSA - Master Data Structures & Algorithms</p>
            <p>Built with Hono + Bun + JSX</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
