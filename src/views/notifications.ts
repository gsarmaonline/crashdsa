import { html, raw } from 'hono/html'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export function notificationsPage(user: User | null = null) {
  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifications - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .notifications-header h1 {
      margin-bottom: 0;
    }

    .unread-badge {
      display: inline-block;
      background: var(--primary);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .notification-item {
      background: white;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      transition: box-shadow 0.2s;
    }

    .notification-item.unread {
      border-left: 4px solid var(--primary);
      background: #f0f7ff;
    }

    .notification-item:hover {
      box-shadow: var(--shadow-md);
    }

    .notification-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .notification-body {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text);
      margin-bottom: 0.25rem;
    }

    .notification-message {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 0.5rem;
    }

    .notification-meta {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .notification-type-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }

    .type-info { background: #dbeafe; color: #1e40af; }
    .type-success { background: #dcfce7; color: #166534; }
    .type-warning { background: #fef9c3; color: #854d0e; }
    .type-error { background: #fee2e2; color: #991b1b; }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0.3rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.85rem;
      transition: color 0.2s, background 0.2s;
    }

    .btn-icon:hover {
      color: var(--text);
      background: var(--border);
    }

    .btn-icon.delete:hover {
      color: var(--danger);
      background: #fee2e2;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      color: var(--text);
      margin-top: 0;
      font-size: 1.5rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    @media (max-width: 768px) {
      .notifications-header {
        flex-direction: column;
        align-items: stretch;
      }
      .notification-item {
        padding: 1rem;
        flex-wrap: wrap;
      }
      .notification-actions {
        flex-direction: row;
        width: 100%;
        justify-content: flex-end;
      }
    }
  </style>
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container">
      <div class="notifications-header">
        <div>
          <h1>Notifications <span class="unread-badge" id="unread-count" style="display:none"></span></h1>
          <p class="subtitle" style="margin-bottom:0">Stay up to date with your activity</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="markAllRead()" id="mark-all-btn" style="display:none">Mark all as read</button>
        </div>
      </div>

      <div id="notifications-content">
        <div class="loading">Loading notifications...</div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 CrashDSA - Master Data Structures &amp; Algorithms</p>
      <p>Built with &hearts; using Hono + Bun</p>
    </div>
  </footer>

  <script>
    var notificationsData = []

    function typeIcon(type) {
      var icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }
      return icons[type] || 'ℹ️'
    }

    function formatDate(dateStr) {
      var d = new Date(dateStr)
      var now = new Date()
      var diff = now - d
      var mins = Math.floor(diff / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return mins + 'm ago'
      var hours = Math.floor(mins / 60)
      if (hours < 24) return hours + 'h ago'
      var days = Math.floor(hours / 24)
      if (days < 7) return days + 'd ago'
      return d.toLocaleDateString()
    }

    function escapeHtml(str) {
      var div = document.createElement('div')
      div.textContent = str || ''
      return div.innerHTML
    }

    async function loadNotifications() {
      var container = document.getElementById('notifications-content')
      try {
        var res = await fetch('/api/user/notifications')
        var data = await res.json()
        notificationsData = data.notifications || []
        updateUnreadBadge(data.unread_count || 0)
        renderNotifications()
      } catch (err) {
        container.innerHTML = '<div class="loading">Failed to load notifications.</div>'
      }
    }

    function updateUnreadBadge(count) {
      var badge = document.getElementById('unread-count')
      var markAllBtn = document.getElementById('mark-all-btn')
      if (count > 0) {
        badge.textContent = count
        badge.style.display = 'inline-block'
        markAllBtn.style.display = 'inline-block'
      } else {
        badge.style.display = 'none'
        markAllBtn.style.display = 'none'
      }
    }

    function renderNotifications() {
      var container = document.getElementById('notifications-content')
      if (!notificationsData || notificationsData.length === 0) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-state-icon">🔔</div>' +
            '<h2>No notifications</h2>' +
            '<p>You are all caught up! Notifications will appear here when there is activity.</p>' +
          '</div>'
        return
      }

      var html = '<div class="notifications-list">'
      for (var i = 0; i < notificationsData.length; i++) {
        var n = notificationsData[i]
        html += '<div class="notification-item' + (n.is_read ? '' : ' unread') + '" id="notif-' + n.id + '">'
        html += '<div class="notification-icon">' + typeIcon(n.type) + '</div>'
        html += '<div class="notification-body">'
        html += '<div class="notification-title">' + escapeHtml(n.title) + '</div>'
        if (n.message) {
          html += '<div class="notification-message">' + escapeHtml(n.message) + '</div>'
        }
        html += '<div class="notification-meta">'
        html += '<span class="notification-type-badge type-' + n.type + '">' + n.type + '</span>'
        html += '<span>' + formatDate(n.created_at) + '</span>'
        html += '</div>'
        html += '</div>'
        html += '<div class="notification-actions">'
        if (!n.is_read) {
          html += '<button class="btn-icon" onclick="markRead(' + n.id + ')" title="Mark as read">✓ Read</button>'
        }
        html += '<button class="btn-icon delete" onclick="deleteNotif(' + n.id + ')" title="Delete">✕</button>'
        html += '</div>'
        html += '</div>'
      }
      html += '</div>'
      container.innerHTML = html
    }

    async function markRead(id) {
      try {
        var res = await fetch('/api/user/notifications/' + id + '/read', { method: 'PATCH' })
        if (!res.ok) return
        var idx = notificationsData.findIndex(function(n) { return n.id === id })
        if (idx !== -1) notificationsData[idx].is_read = true
        var unread = notificationsData.filter(function(n) { return !n.is_read }).length
        updateUnreadBadge(unread)
        renderNotifications()
      } catch (err) {}
    }

    async function markAllRead() {
      try {
        await fetch('/api/user/notifications/read-all', { method: 'PATCH' })
        notificationsData.forEach(function(n) { n.is_read = true })
        updateUnreadBadge(0)
        renderNotifications()
      } catch (err) {}
    }

    async function deleteNotif(id) {
      try {
        var res = await fetch('/api/user/notifications/' + id, { method: 'DELETE' })
        if (!res.ok) return
        notificationsData = notificationsData.filter(function(n) { return n.id !== id })
        var unread = notificationsData.filter(function(n) { return !n.is_read }).length
        updateUnreadBadge(unread)
        renderNotifications()
      } catch (err) {}
    }

    loadNotifications()
  </script>
</body>
</html>
`
}
