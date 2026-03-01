import type { User } from '../db/users.js'

export function navbar(user: User | null): string {
  const authSection = user
    ? `<div class="nav-user">
         <img src="${user.avatar_url}" alt="${user.username}" class="nav-avatar" />
         <span class="nav-username">${user.display_name || user.username}</span>
         <a href="/auth/logout" class="btn btn-small btn-secondary">Logout</a>
       </div>`
    : process.env.GITHUB_CLIENT_ID
      ? `<a href="/login" class="btn btn-small btn-primary">Login with GitHub</a>`
      : ''

  return `
    <nav class="navbar">
      <div class="container">
        <div class="nav-top">
          <div class="nav-brand">
            <a href="/">🚀 CrashDSA</a>
          </div>
          <button class="nav-toggle" onclick="document.querySelector('.navbar').classList.toggle('nav-open')" aria-label="Toggle navigation">
            <span class="nav-toggle-bar"></span>
            <span class="nav-toggle-bar"></span>
            <span class="nav-toggle-bar"></span>
          </button>
        </div>
        <div class="nav-menu">
          <div class="nav-links">
            <a href="/">Home</a>
            <a href="/problems">Problems</a>
            <a href="/patterns">Patterns</a>
            ${user ? '<a href="/progress">Progress</a>' : ''}
            ${user ? '<a href="/groups">Groups</a>' : ''}
            ${user ? '<a href="/notifications">Notifications</a>' : ''}
            <a href="/api-docs" target="_blank">API Docs</a>
          </div>
          <div class="nav-auth">
            ${authSection}
          </div>
        </div>
      </div>
    </nav>
  `
}
