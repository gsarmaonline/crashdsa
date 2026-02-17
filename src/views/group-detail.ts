import { html, raw } from 'hono/html'
import { navbar } from '../components/navbar.js'
import type { User } from '../db/users.js'

export function groupDetailPage(groupId: number, user: User | null = null) {
  return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Group - CrashDSA</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    .group-detail-header {
      margin-bottom: 2rem;
    }

    .group-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .group-title-row h1 {
      margin-bottom: 0.25rem;
    }

    .group-desc {
      color: var(--text-secondary);
      margin-top: 0.5rem;
      font-size: 1rem;
    }

    .group-actions {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }

    /* Invite code box */
    .invite-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .invite-box-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .invite-code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--primary);
      letter-spacing: 0.05em;
    }

    .btn-copy {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .btn-copy:hover { background: var(--primary-dark); }

    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 2px solid var(--border);
      margin-bottom: 1.5rem;
      gap: 0;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      font-weight: 500;
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
      background: none;
      border-top: none;
      border-left: none;
      border-right: none;
      font-size: 0.95rem;
      font-family: inherit;
    }

    .tab:hover { color: var(--text); }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-panel {
      display: none;
    }

    .tab-panel.active {
      display: block;
    }

    /* Members list */
    .members-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .member-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .member-item:last-child { border-bottom: none; }

    .member-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .member-name {
      font-weight: 500;
      color: var(--text);
    }

    .member-username {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .member-role-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }

    .member-role-admin {
      background: #dbeafe;
      color: #1e40af;
    }

    .member-role-member {
      background: #f3f4f6;
      color: #6b7280;
    }

    .member-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-danger-small {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      background: white;
      color: var(--danger);
      border: 1px solid var(--danger);
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-danger-small:hover {
      background: var(--danger);
      color: white;
    }

    /* Progress leaderboard */
    .leaderboard {
      width: 100%;
      border-collapse: collapse;
    }

    .leaderboard th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
      border-bottom: 2px solid var(--border);
    }

    .leaderboard td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    .leaderboard tr:last-child td { border-bottom: none; }

    .leaderboard-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .leaderboard-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .leaderboard-name {
      font-weight: 500;
    }

    .leaderboard-bar-container {
      background: #f3f4f6;
      border-radius: 0.5rem;
      height: 1rem;
      min-width: 120px;
      overflow: hidden;
    }

    .leaderboard-bar-fill {
      height: 100%;
      border-radius: 0.5rem;
      background: var(--primary);
      transition: width 0.3s ease;
    }

    .leaderboard-count {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
    }

    .rank-badge {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .rank-1 { background: #fef3c7; color: #92400e; }
    .rank-2 { background: #e5e7eb; color: #4b5563; }
    .rank-3 { background: #fed7aa; color: #9a3412; }
    .rank-other { background: #f3f4f6; color: #6b7280; }

    .progress-section {
      background: white;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      overflow-x: auto;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    /* Settings section */
    .settings-section {
      background: white;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .settings-section h3 {
      margin-bottom: 1rem;
    }

    .danger-zone {
      border-color: #fecaca;
    }

    .danger-zone h3 {
      color: var(--danger);
    }

    @media (max-width: 768px) {
      .group-title-row {
        flex-direction: column;
      }

      .group-actions {
        width: 100%;
      }

      .group-actions .btn {
        flex: 1;
        text-align: center;
      }

      .invite-box {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;
      }

      .invite-code {
        font-size: 0.95rem;
        word-break: break-all;
      }

      .btn-copy {
        align-self: flex-start;
      }

      .tabs {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .tab {
        padding: 0.75rem 1rem;
        font-size: 0.85rem;
        white-space: nowrap;
      }

      .progress-section {
        padding: 1rem;
      }

      .leaderboard th,
      .leaderboard td {
        padding: 0.5rem;
      }

      .leaderboard th:nth-child(3),
      .leaderboard td:nth-child(3) {
        display: none;
      }

      .leaderboard-avatar {
        width: 28px;
        height: 28px;
      }

      .leaderboard-name {
        font-size: 0.9rem;
      }

      .member-item {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .member-avatar {
        width: 34px;
        height: 34px;
      }

      .settings-section {
        padding: 1.25rem;
      }
    }
  </style>
</head>
<body>
  ${raw(navbar(user))}

  <main class="main-content">
    <section class="container">
      <div id="group-content">
        <div class="loading">Loading group...</div>
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
    var GROUP_ID = ${groupId}
    var CURRENT_USER_ID = ${user?.id || 0}
    var groupData = null
    var progressData = null
    var userRole = null

    async function loadGroup() {
      var container = document.getElementById('group-content')
      try {
        var res = await fetch('/api/groups/' + GROUP_ID)
        if (res.status === 403) {
          container.innerHTML = '<div class="loading">You are not a member of this group.</div>'
          return
        }
        if (!res.ok) {
          container.innerHTML = '<div class="loading">Group not found.</div>'
          return
        }
        groupData = await res.json()
        userRole = groupData.role

        // Load progress in parallel
        var progRes = await fetch('/api/groups/' + GROUP_ID + '/progress')
        progressData = await progRes.json()

        renderGroup()
      } catch (err) {
        container.innerHTML = '<div class="loading">Failed to load group.</div>'
      }
    }

    function renderGroup() {
      var container = document.getElementById('group-content')
      var g = groupData.group
      var members = groupData.members
      var progress = progressData.progress || []

      // Update page title
      document.title = escapeHtml(g.name) + ' - CrashDSA'

      var html = ''

      // Header
      html += '<div class="group-detail-header">'
      html += '<div class="group-title-row">'
      html += '<div>'
      html += '<h1>' + escapeHtml(g.name) + '</h1>'
      if (g.description) {
        html += '<p class="group-desc">' + escapeHtml(g.description) + '</p>'
      }
      html += '</div>'
      html += '<div class="group-actions">'
      html += '<a href="/groups" class="btn btn-secondary btn-small">Back to Groups</a>'
      html += '</div>'
      html += '</div>'
      html += '</div>'

      // Invite code
      html += '<div class="invite-box">'
      html += '<div>'
      html += '<div class="invite-box-label">Share this invite code with friends</div>'
      html += '<span class="invite-code" id="invite-code-value">' + g.invite_code + '</span>'
      html += '</div>'
      html += '<button class="btn-copy" onclick="copyInviteCode()">Copy Code</button>'
      html += '</div>'

      // Tabs
      html += '<div class="tabs">'
      html += '<button class="tab active" onclick="switchTab(\'progress\')">Progress</button>'
      html += '<button class="tab" onclick="switchTab(\'members\')">Members (' + members.length + ')</button>'
      if (userRole === 'admin') {
        html += '<button class="tab" onclick="switchTab(\'settings\')">Settings</button>'
      }
      html += '</div>'

      // Progress tab
      html += '<div class="tab-panel active" id="tab-progress">'
      html += renderProgressTab(progress)
      html += '</div>'

      // Members tab
      html += '<div class="tab-panel" id="tab-members">'
      html += renderMembersTab(members)
      html += '</div>'

      // Settings tab (admin only)
      if (userRole === 'admin') {
        html += '<div class="tab-panel" id="tab-settings">'
        html += renderSettingsTab(g)
        html += '</div>'
      }

      container.innerHTML = html
    }

    function renderProgressTab(progress) {
      if (progress.length === 0) {
        return '<div class="loading">No members yet.</div>'
      }

      // Sort by solved count descending
      var sorted = progress.slice().sort(function(a, b) { return b.solved_count - a.solved_count })
      var maxSolved = sorted.length > 0 ? sorted[0].solved_count : 1

      var html = '<div class="progress-section">'
      html += '<table class="leaderboard">'
      html += '<thead><tr>'
      html += '<th style="width:3rem">#</th>'
      html += '<th>Member</th>'
      html += '<th>Progress</th>'
      html += '<th style="width:5rem;text-align:right">Solved</th>'
      html += '</tr></thead>'
      html += '<tbody>'

      for (var i = 0; i < sorted.length; i++) {
        var m = sorted[i]
        var rank = i + 1
        var rankClass = rank <= 3 ? 'rank-' + rank : 'rank-other'
        var barPct = maxSolved > 0 ? Math.round((m.solved_count / maxSolved) * 100) : 0

        html += '<tr>'
        html += '<td><span class="rank-badge ' + rankClass + '">' + rank + '</span></td>'
        html += '<td>'
        html += '<div class="leaderboard-user">'
        if (m.avatar_url) {
          html += '<img src="' + m.avatar_url + '" class="leaderboard-avatar" />'
        }
        html += '<span class="leaderboard-name">' + escapeHtml(m.display_name || m.username) + '</span>'
        html += '</div>'
        html += '</td>'
        html += '<td><div class="leaderboard-bar-container"><div class="leaderboard-bar-fill" style="width:' + barPct + '%"></div></div></td>'
        html += '<td style="text-align:right"><span class="leaderboard-count">' + m.solved_count + '</span></td>'
        html += '</tr>'
      }

      html += '</tbody></table></div>'
      return html
    }

    function renderMembersTab(members) {
      var html = '<ul class="members-list">'

      for (var i = 0; i < members.length; i++) {
        var m = members[i]
        html += '<li class="member-item">'
        html += '<div class="member-info">'
        if (m.avatar_url) {
          html += '<img src="' + m.avatar_url + '" class="member-avatar" />'
        }
        html += '<div>'
        html += '<div class="member-name">' + escapeHtml(m.display_name || m.username) + '</div>'
        html += '<div class="member-username">@' + escapeHtml(m.username) + '</div>'
        html += '</div>'
        html += '</div>'
        html += '<div class="member-actions">'
        html += '<span class="member-role-badge member-role-' + m.role + '">' + m.role + '</span>'

        // Admin can remove non-admin members; anyone can leave
        if (m.user_id === CURRENT_USER_ID && m.role !== 'admin') {
          html += '<button class="btn-danger-small" onclick="removeMember(' + m.user_id + ', true)">Leave</button>'
        } else if (userRole === 'admin' && m.role !== 'admin' && m.user_id !== CURRENT_USER_ID) {
          html += '<button class="btn-danger-small" onclick="removeMember(' + m.user_id + ', false)">Remove</button>'
        }

        html += '</div>'
        html += '</li>'
      }

      html += '</ul>'
      return html
    }

    function renderSettingsTab(g) {
      var html = ''

      html += '<div class="settings-section">'
      html += '<h3>Edit Group</h3>'
      html += '<form onsubmit="updateGroup(event)">'
      html += '<div class="form-group">'
      html += '<label for="edit-name">Group Name</label>'
      html += '<input type="text" id="edit-name" value="' + escapeAttr(g.name) + '" maxlength="255" required />'
      html += '</div>'
      html += '<div class="form-group">'
      html += '<label for="edit-desc">Description</label>'
      html += '<textarea id="edit-desc">' + escapeHtml(g.description || '') + '</textarea>'
      html += '</div>'
      html += '<div class="form-error" id="edit-error"></div>'
      html += '<button type="submit" class="btn btn-primary btn-small" id="edit-btn">Save Changes</button>'
      html += '</form>'
      html += '</div>'

      html += '<div class="settings-section danger-zone">'
      html += '<h3>Danger Zone</h3>'
      html += '<p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:1rem">Deleting this group will remove all members and data. This cannot be undone.</p>'
      html += '<button class="btn-danger-small" onclick="deleteGroup()" style="padding:0.5rem 1rem;font-size:0.85rem">Delete Group</button>'
      html += '</div>'

      return html
    }

    function switchTab(name) {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active') })
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active') })

      document.getElementById('tab-' + name).classList.add('active')
      // Activate the matching button
      var tabs = document.querySelectorAll('.tab')
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].textContent.toLowerCase().indexOf(name) === 0) {
          tabs[i].classList.add('active')
          break
        }
      }
    }

    function copyInviteCode() {
      var code = document.getElementById('invite-code-value').textContent
      navigator.clipboard.writeText(code).then(function() {
        var btn = document.querySelector('.btn-copy')
        btn.textContent = 'Copied!'
        setTimeout(function() { btn.textContent = 'Copy Code' }, 2000)
      })
    }

    async function removeMember(userId, isSelf) {
      var msg = isSelf ? 'Leave this group?' : 'Remove this member?'
      if (!confirm(msg)) return

      try {
        var res = await fetch('/api/groups/' + GROUP_ID + '/members/' + userId, { method: 'DELETE' })
        if (!res.ok) {
          var data = await res.json()
          alert(data.error || 'Failed')
          return
        }
        if (isSelf) {
          window.location.href = '/groups'
        } else {
          loadGroup()
        }
      } catch (err) {
        alert('Network error')
      }
    }

    async function updateGroup(e) {
      e.preventDefault()
      var btn = document.getElementById('edit-btn')
      var errEl = document.getElementById('edit-error')
      btn.disabled = true
      btn.textContent = 'Saving...'
      errEl.style.display = 'none'

      try {
        var res = await fetch('/api/groups/' + GROUP_ID, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: document.getElementById('edit-name').value,
            description: document.getElementById('edit-desc').value
          })
        })
        var data = await res.json()
        if (!res.ok) {
          errEl.textContent = data.error || 'Failed to update'
          errEl.style.display = 'block'
          return
        }
        loadGroup()
      } catch (err) {
        errEl.textContent = 'Network error'
        errEl.style.display = 'block'
      } finally {
        btn.disabled = false
        btn.textContent = 'Save Changes'
      }
    }

    async function deleteGroup() {
      if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return

      try {
        var res = await fetch('/api/groups/' + GROUP_ID, { method: 'DELETE' })
        if (!res.ok) {
          var data = await res.json()
          alert(data.error || 'Failed to delete')
          return
        }
        window.location.href = '/groups'
      } catch (err) {
        alert('Network error')
      }
    }

    function escapeHtml(str) {
      var div = document.createElement('div')
      div.textContent = str || ''
      return div.innerHTML
    }

    function escapeAttr(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    loadGroup()
  </script>
</body>
</html>
`
}
