import { html, raw } from 'hono/html'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export function groupsPage(user: User | null = null) {
  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Groups - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    .groups-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .groups-header h1 {
      margin-bottom: 0;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .group-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .group-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .group-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .group-card-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text);
    }

    .group-card-role {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .role-admin {
      background: #dbeafe;
      color: #1e40af;
    }

    .role-member {
      background: #f3f4f6;
      color: #6b7280;
    }

    .group-card-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .group-card-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .group-card-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Create / Join modals */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 200;
      justify-content: center;
      align-items: center;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal {
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
      max-width: 460px;
      width: 90%;
      box-shadow: var(--shadow-lg);
    }

    .modal h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.4rem;
      font-size: 0.9rem;
      color: var(--text);
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      font-size: 0.95rem;
      font-family: inherit;
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      border-color: var(--primary);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .form-error {
      color: var(--danger);
      font-size: 0.85rem;
      margin-top: 0.5rem;
      display: none;
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

    .empty-state p {
      margin-bottom: 1.5rem;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .groups-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions .btn {
        flex: 1;
        text-align: center;
      }

      .groups-grid {
        grid-template-columns: 1fr;
      }

      .group-card {
        padding: 1.25rem;
      }

      .modal {
        width: 95%;
        padding: 1.5rem;
      }

      .empty-state {
        padding: 2.5rem 1rem;
      }
    }
  </style>
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container">
      <div class="groups-header">
        <div>
          <h1>Study Groups</h1>
          <p class="subtitle" style="margin-bottom:0">Team up with friends and track progress together</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" onclick="showJoinModal()">Join Group</button>
          <button class="btn btn-primary" onclick="showCreateModal()">Create Group</button>
        </div>
      </div>

      <div id="groups-content">
        <div class="loading">Loading groups...</div>
      </div>
    </section>
  </main>

  <!-- Create Group Modal -->
  <div class="modal-overlay" id="create-modal">
    <div class="modal">
      <h2>Create a Study Group</h2>
      <form onsubmit="createGroup(event)">
        <div class="form-group">
          <label for="group-name">Group Name</label>
          <input type="text" id="group-name" placeholder="e.g. FAANG Prep Squad" maxlength="255" required />
        </div>
        <div class="form-group">
          <label for="group-desc">Description (optional)</label>
          <textarea id="group-desc" placeholder="What's this group about?"></textarea>
        </div>
        <div class="form-error" id="create-error"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-small" onclick="hideModals()">Cancel</button>
          <button type="submit" class="btn btn-primary btn-small" id="create-btn">Create</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Join Group Modal -->
  <div class="modal-overlay" id="join-modal">
    <div class="modal">
      <h2>Join a Study Group</h2>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1.25rem">Enter the invite code shared by your friend.</p>
      <form onsubmit="joinGroup(event)">
        <div class="form-group">
          <label for="invite-code">Invite Code</label>
          <input type="text" id="invite-code" placeholder="e.g. a1b2c3d4e5f6g7h8" required />
        </div>
        <div class="form-error" id="join-error"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary btn-small" onclick="hideModals()">Cancel</button>
          <button type="submit" class="btn btn-primary btn-small" id="join-btn">Join</button>
        </div>
      </form>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 CrashDSA - Master Data Structures &amp; Algorithms</p>
      <p>Built with &hearts; using Hono + Bun</p>
    </div>
  </footer>

  <script>
    async function loadGroups() {
      var container = document.getElementById('groups-content')
      try {
        var response = await fetch('/api/groups')
        var data = await response.json()
        renderGroups(data.groups)
      } catch (err) {
        container.innerHTML = '<div class="loading">Failed to load groups.</div>'
      }
    }

    function renderGroups(groups) {
      var container = document.getElementById('groups-content')

      if (!groups || groups.length === 0) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-state-icon">👥</div>' +
            '<h2>No groups yet</h2>' +
            '<p>Create a study group and invite your friends, or join one with an invite code.</p>' +
            '<div class="header-actions" style="justify-content:center">' +
              '<button class="btn btn-secondary" onclick="showJoinModal()">Join Group</button>' +
              '<button class="btn btn-primary" onclick="showCreateModal()">Create Group</button>' +
            '</div>' +
          '</div>'
        return
      }

      var html = '<div class="groups-grid">'
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i]
        html += '<a href="/groups/' + g.id + '" class="group-card">'
        html += '<div class="group-card-header">'
        html += '<span class="group-card-name">' + escapeHtml(g.name) + '</span>'
        html += '<span class="group-card-role ' + (g.role === 'admin' ? 'role-admin' : 'role-member') + '">' + g.role + '</span>'
        html += '</div>'
        if (g.description) {
          html += '<div class="group-card-desc">' + escapeHtml(g.description) + '</div>'
        }
        html += '<div class="group-card-meta">'
        html += '<span>👥 ' + g.member_count + ' member' + (g.member_count !== 1 ? 's' : '') + '</span>'
        html += '</div>'
        html += '</a>'
      }
      html += '</div>'
      container.innerHTML = html
    }

    function showCreateModal() {
      document.getElementById('create-modal').classList.add('active')
      document.getElementById('group-name').focus()
    }

    function showJoinModal() {
      document.getElementById('join-modal').classList.add('active')
      document.getElementById('invite-code').focus()
    }

    function hideModals() {
      document.getElementById('create-modal').classList.remove('active')
      document.getElementById('join-modal').classList.remove('active')
      document.getElementById('create-error').style.display = 'none'
      document.getElementById('join-error').style.display = 'none'
    }

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target === el) hideModals()
      })
    })

    async function createGroup(e) {
      e.preventDefault()
      var btn = document.getElementById('create-btn')
      var errEl = document.getElementById('create-error')
      btn.disabled = true
      btn.textContent = 'Creating...'
      errEl.style.display = 'none'

      try {
        var res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('group-name').value,
            description: document.getElementById('group-desc').value || undefined
          })
        })
        var data = await res.json()
        if (!res.ok) {
          errEl.textContent = data.error || 'Failed to create group'
          errEl.style.display = 'block'
          return
        }
        window.location.href = '/groups/' + data.group.id
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.'
        errEl.style.display = 'block'
      } finally {
        btn.disabled = false
        btn.textContent = 'Create'
      }
    }

    async function joinGroup(e) {
      e.preventDefault()
      var btn = document.getElementById('join-btn')
      var errEl = document.getElementById('join-error')
      btn.disabled = true
      btn.textContent = 'Joining...'
      errEl.style.display = 'none'

      try {
        var res = await fetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invite_code: document.getElementById('invite-code').value.trim()
          })
        })
        var data = await res.json()
        if (!res.ok) {
          errEl.textContent = data.error || 'Failed to join group'
          errEl.style.display = 'block'
          return
        }
        window.location.href = '/groups/' + data.group.id
      } catch (err) {
        errEl.textContent = 'Network error. Please try again.'
        errEl.style.display = 'block'
      } finally {
        btn.disabled = false
        btn.textContent = 'Join'
      }
    }

    function escapeHtml(str) {
      var div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }

    loadGroups()
  </script>
</body>
</html>
`
}
