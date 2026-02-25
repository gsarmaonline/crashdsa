import { Hono } from 'hono'
import type { AuthVariables } from '../auth/middleware.js'
import {
  createGroup,
  getGroupById,
  getGroupByInviteCode,
  getUserGroups,
  updateGroup,
  deleteGroup,
  isGroupMember,
  getGroupRole,
  joinGroup,
  removeMember,
  getGroupMembers,
  getGroupProgress,
  getMemberProgress,
  getGroupActivity,
  getGroupRawStats,
} from '../db/study-groups.js'
import { getProblemTitlesBySlug, getPatternsBySlug, getPatternDisplayNames } from '../data/problem-repository.js'

const groups = new Hono<{ Variables: AuthVariables }>()

// --- Group CRUD ---

// List user's groups
groups.get('/api/groups', async (c) => {
  const user = c.get('user')!
  const userGroups = await getUserGroups(user.id)
  return c.json({ groups: userGroups })
})

// Create a group
groups.post('/api/groups', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ name?: string; description?: string }>()

  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Group name is required' }, 400)
  }
  if (body.name.length > 255) {
    return c.json({ error: 'Group name must be 255 characters or less' }, 400)
  }

  const group = await createGroup(user.id, body.name.trim(), body.description?.trim())
  return c.json({ group }, 201)
})

// Get group details
groups.get('/api/groups/:id', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  const group = await getGroupById(groupId)
  if (!group) return c.json({ error: 'Group not found' }, 404)

  const members = await getGroupMembers(groupId)
  const role = await getGroupRole(groupId, user.id)

  return c.json({ group, members, role })
})

// Update group (admin only)
groups.patch('/api/groups/:id', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const role = await getGroupRole(groupId, user.id)
  if (role !== 'admin') return c.json({ error: 'Only admins can update the group' }, 403)

  const body = await c.req.json<{ name?: string; description?: string }>()
  if (body.name !== undefined && body.name.trim().length === 0) {
    return c.json({ error: 'Group name cannot be empty' }, 400)
  }
  if (body.name && body.name.length > 255) {
    return c.json({ error: 'Group name must be 255 characters or less' }, 400)
  }

  const group = await updateGroup(groupId, {
    name: body.name?.trim(),
    description: body.description?.trim(),
  })
  if (!group) return c.json({ error: 'Group not found' }, 404)

  return c.json({ group })
})

// Delete group (admin only)
groups.delete('/api/groups/:id', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const role = await getGroupRole(groupId, user.id)
  if (role !== 'admin') return c.json({ error: 'Only admins can delete the group' }, 403)

  await deleteGroup(groupId)
  return c.json({ deleted: true })
})

// --- Membership ---

// Join a group via invite code
groups.post('/api/groups/join', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ invite_code?: string }>()

  if (!body.invite_code || body.invite_code.trim().length === 0) {
    return c.json({ error: 'Invite code is required' }, 400)
  }

  const group = await getGroupByInviteCode(body.invite_code.trim())
  if (!group) return c.json({ error: 'Invalid invite code' }, 404)

  const result = await joinGroup(group.id, user.id)
  return c.json({ group, alreadyMember: result.alreadyMember })
})

// Remove a member (admin or self)
groups.delete('/api/groups/:id/members/:userId', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  const targetUserId = parseInt(c.req.param('userId'), 10)
  if (isNaN(groupId) || isNaN(targetUserId)) return c.json({ error: 'Invalid ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  // Can remove yourself, or admins can remove others
  if (user.id !== targetUserId) {
    const role = await getGroupRole(groupId, user.id)
    if (role !== 'admin') return c.json({ error: 'Only admins can remove other members' }, 403)

    // Prevent removing other admins
    const targetRole = await getGroupRole(groupId, targetUserId)
    if (targetRole === 'admin') return c.json({ error: 'Cannot remove another admin' }, 403)
  }

  await removeMember(groupId, targetUserId)
  return c.json({ removed: true })
})

// --- Progress ---

// Get group progress (all members' solve counts)
groups.get('/api/groups/:id/progress', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  const progress = await getGroupProgress(groupId)
  return c.json({ progress })
})

// Get a specific member's progress
groups.get('/api/groups/:id/members/:userId/progress', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  const targetUserId = parseInt(c.req.param('userId'), 10)
  if (isNaN(groupId) || isNaN(targetUserId)) return c.json({ error: 'Invalid ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  const progress = await getMemberProgress(groupId, targetUserId)
  if (!progress) return c.json({ error: 'Member not found in this group' }, 404)

  return c.json({ progress })
})

// Get group activity feed
groups.get('/api/groups/:id/activity', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  const limitParam = c.req.query('limit')
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20

  const activity = await getGroupActivity(groupId, limit)

  const uniqueSlugs = [...new Set(activity.map(a => a.problem_slug))]
  const titleMap = await getProblemTitlesBySlug(uniqueSlugs)

  return c.json({
    activity: activity.map(a => ({
      user_id: a.user_id,
      username: a.username,
      display_name: a.display_name,
      avatar_url: a.avatar_url,
      problem_slug: a.problem_slug,
      problem_title: titleMap.get(a.problem_slug) || a.problem_slug,
      solved_at: a.solved_at,
    })),
  })
})

// Get group stats
groups.get('/api/groups/:id/stats', async (c) => {
  const user = c.get('user')!
  const groupId = parseInt(c.req.param('id'), 10)
  if (isNaN(groupId)) return c.json({ error: 'Invalid group ID' }, 400)

  const isMember = await isGroupMember(groupId, user.id)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  const rawStats = await getGroupRawStats(groupId)

  const slugsToFetch = rawStats.most_solved_slug ? [rawStats.most_solved_slug] : []
  const [titleMap, patternMap, displayNameMap] = await Promise.all([
    getProblemTitlesBySlug(slugsToFetch),
    getPatternsBySlug(rawStats.all_solved_slugs),
    getPatternDisplayNames(),
  ])

  // Count pattern frequencies across all solved problems
  const patternFreq = new Map<string, number>()
  for (const [, patterns] of patternMap) {
    for (const p of patterns) {
      patternFreq.set(p, (patternFreq.get(p) || 0) + 1)
    }
  }

  let favoritePattern: { name: string; display_name: string; problem_count: number } | null = null
  let maxFreq = 0
  for (const [name, count] of patternFreq) {
    if (count > maxFreq) {
      maxFreq = count
      favoritePattern = { name, display_name: displayNameMap.get(name) || name, problem_count: count }
    }
  }

  return c.json({
    stats: {
      total_unique_solved: rawStats.total_unique_solved,
      most_solved: rawStats.most_solved_slug
        ? {
            slug: rawStats.most_solved_slug,
            title: titleMap.get(rawStats.most_solved_slug) || rawStats.most_solved_slug,
            solved_by_count: rawStats.most_solved_count,
          }
        : null,
      favorite_pattern: favoritePattern,
      active_this_week: rawStats.active_this_week,
    },
  })
})

export default groups
