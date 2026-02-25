import sql from './connection.js'
import crypto from 'crypto'

export interface StudyGroup {
  id: number
  name: string
  description: string | null
  invite_code: string
  created_by: number
  created_at: Date
  updated_at: Date
}

export interface StudyGroupMember {
  id: number
  group_id: number
  user_id: number
  role: string
  joined_at: Date
}

export interface GroupWithMemberCount extends StudyGroup {
  member_count: number
  role: string
}

export interface MemberWithUser {
  user_id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  role: string
  joined_at: Date
}

export interface MemberProgress {
  user_id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  solved_slugs: string[]
  solved_count: number
}

function generateInviteCode(): string {
  return crypto.randomBytes(8).toString('hex')
}

// --- Group CRUD ---

export async function createGroup(userId: number, name: string, description?: string): Promise<StudyGroup> {
  if (!sql) throw new Error('Database not configured')

  const inviteCode = generateInviteCode()

  const [group] = await sql<StudyGroup[]>`
    INSERT INTO study_groups (name, description, invite_code, created_by)
    VALUES (${name}, ${description || null}, ${inviteCode}, ${userId})
    RETURNING *
  `

  // Creator is automatically an admin member
  await sql`
    INSERT INTO study_group_members (group_id, user_id, role)
    VALUES (${group.id}, ${userId}, 'admin')
  `

  return group
}

export async function getGroupById(groupId: number): Promise<StudyGroup | null> {
  if (!sql) return null

  const [group] = await sql<StudyGroup[]>`
    SELECT * FROM study_groups WHERE id = ${groupId}
  `
  return group || null
}

export async function getGroupByInviteCode(inviteCode: string): Promise<StudyGroup | null> {
  if (!sql) return null

  const [group] = await sql<StudyGroup[]>`
    SELECT * FROM study_groups WHERE invite_code = ${inviteCode}
  `
  return group || null
}

export async function getUserGroups(userId: number): Promise<GroupWithMemberCount[]> {
  if (!sql) return []

  return sql<GroupWithMemberCount[]>`
    SELECT g.*, sgm.role,
      (SELECT COUNT(*)::int FROM study_group_members WHERE group_id = g.id) AS member_count
    FROM study_groups g
    JOIN study_group_members sgm ON sgm.group_id = g.id AND sgm.user_id = ${userId}
    ORDER BY g.updated_at DESC
  `
}

export async function updateGroup(groupId: number, data: { name?: string; description?: string }): Promise<StudyGroup | null> {
  if (!sql) return null

  const [group] = await sql<StudyGroup[]>`
    UPDATE study_groups
    SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      updated_at = NOW()
    WHERE id = ${groupId}
    RETURNING *
  `
  return group || null
}

export async function deleteGroup(groupId: number): Promise<void> {
  if (!sql) throw new Error('Database not configured')
  await sql`DELETE FROM study_groups WHERE id = ${groupId}`
}

// --- Membership ---

export async function isGroupMember(groupId: number, userId: number): Promise<boolean> {
  if (!sql) return false

  const [row] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM study_group_members WHERE group_id = ${groupId} AND user_id = ${userId}
    ) as exists
  `
  return row.exists
}

export async function getGroupRole(groupId: number, userId: number): Promise<string | null> {
  if (!sql) return null

  const [row] = await sql<{ role: string }[]>`
    SELECT role FROM study_group_members WHERE group_id = ${groupId} AND user_id = ${userId}
  `
  return row?.role || null
}

export async function joinGroup(groupId: number, userId: number): Promise<{ alreadyMember: boolean }> {
  if (!sql) throw new Error('Database not configured')

  const result = await sql`
    INSERT INTO study_group_members (group_id, user_id, role)
    VALUES (${groupId}, ${userId}, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING
    RETURNING id
  `
  return { alreadyMember: result.length === 0 }
}

export async function removeMember(groupId: number, userId: number): Promise<void> {
  if (!sql) throw new Error('Database not configured')
  await sql`DELETE FROM study_group_members WHERE group_id = ${groupId} AND user_id = ${userId}`
}

export async function getGroupMembers(groupId: number): Promise<MemberWithUser[]> {
  if (!sql) return []

  return sql<MemberWithUser[]>`
    SELECT sgm.user_id, u.username, u.display_name, u.avatar_url, sgm.role, sgm.joined_at
    FROM study_group_members sgm
    JOIN users u ON u.id = sgm.user_id
    WHERE sgm.group_id = ${groupId}
    ORDER BY sgm.role ASC, sgm.joined_at ASC
  `
}

// --- Progress ---

export async function getGroupProgress(groupId: number): Promise<MemberProgress[]> {
  if (!sql) return []

  const members = await sql<{ user_id: number; username: string; display_name: string | null; avatar_url: string | null }[]>`
    SELECT sgm.user_id, u.username, u.display_name, u.avatar_url
    FROM study_group_members sgm
    JOIN users u ON u.id = sgm.user_id
    WHERE sgm.group_id = ${groupId}
    ORDER BY sgm.joined_at ASC
  `

  if (members.length === 0) return []

  const userIds = members.map(m => m.user_id)
  const solved = await sql<{ user_id: number; problem_slug: string }[]>`
    SELECT user_id, problem_slug
    FROM user_solved_problems
    WHERE user_id = ANY(${userIds})
  `

  const solvedByUser = new Map<number, string[]>()
  for (const s of solved) {
    if (!solvedByUser.has(s.user_id)) solvedByUser.set(s.user_id, [])
    solvedByUser.get(s.user_id)!.push(s.problem_slug)
  }

  return members.map(m => ({
    user_id: m.user_id,
    username: m.username,
    display_name: m.display_name,
    avatar_url: m.avatar_url,
    solved_slugs: solvedByUser.get(m.user_id) || [],
    solved_count: (solvedByUser.get(m.user_id) || []).length,
  }))
}

export interface GroupActivityItem {
  user_id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  problem_slug: string
  solved_at: Date
}

export interface GroupRawStats {
  total_unique_solved: number
  most_solved_slug: string | null
  most_solved_count: number
  active_this_week: number
  all_solved_slugs: string[]
}

export async function getGroupActivity(groupId: number, limit = 20): Promise<GroupActivityItem[]> {
  if (!sql) return []

  return sql<GroupActivityItem[]>`
    SELECT u.id AS user_id, u.username, u.display_name, u.avatar_url,
           usp.problem_slug, usp.solved_at
    FROM user_solved_problems usp
    JOIN users u ON u.id = usp.user_id
    WHERE usp.user_id IN (
      SELECT user_id FROM study_group_members WHERE group_id = ${groupId}
    )
    ORDER BY usp.solved_at DESC
    LIMIT ${limit}
  `
}

export async function getGroupRawStats(groupId: number): Promise<GroupRawStats> {
  if (!sql) {
    return { total_unique_solved: 0, most_solved_slug: null, most_solved_count: 0, active_this_week: 0, all_solved_slugs: [] }
  }

  const members = await sql<{ user_id: number }[]>`
    SELECT user_id FROM study_group_members WHERE group_id = ${groupId}
  `

  if (members.length === 0) {
    return { total_unique_solved: 0, most_solved_slug: null, most_solved_count: 0, active_this_week: 0, all_solved_slugs: [] }
  }

  const userIds = members.map(m => m.user_id)
  const solved = await sql<{ user_id: number; problem_slug: string; solved_at: Date }[]>`
    SELECT user_id, problem_slug, solved_at
    FROM user_solved_problems
    WHERE user_id = ANY(${userIds})
  `

  const uniqueSlugs = new Set<string>()
  const slugUserSets = new Map<string, Set<number>>()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const activeUsers = new Set<number>()

  for (const row of solved) {
    uniqueSlugs.add(row.problem_slug)

    if (!slugUserSets.has(row.problem_slug)) slugUserSets.set(row.problem_slug, new Set())
    slugUserSets.get(row.problem_slug)!.add(row.user_id)

    if (new Date(row.solved_at) >= weekAgo) activeUsers.add(row.user_id)
  }

  let mostSolvedSlug: string | null = null
  let mostSolvedCount = 0
  for (const [slug, users] of slugUserSets) {
    if (users.size > mostSolvedCount) {
      mostSolvedCount = users.size
      mostSolvedSlug = slug
    }
  }

  return {
    total_unique_solved: uniqueSlugs.size,
    most_solved_slug: mostSolvedSlug,
    most_solved_count: mostSolvedCount,
    active_this_week: activeUsers.size,
    all_solved_slugs: [...uniqueSlugs],
  }
}

export async function getMemberProgress(groupId: number, userId: number): Promise<MemberProgress | null> {
  if (!sql) return null

  const [member] = await sql<{ user_id: number; username: string; display_name: string | null; avatar_url: string | null }[]>`
    SELECT sgm.user_id, u.username, u.display_name, u.avatar_url
    FROM study_group_members sgm
    JOIN users u ON u.id = sgm.user_id
    WHERE sgm.group_id = ${groupId} AND sgm.user_id = ${userId}
  `

  if (!member) return null

  const solved = await sql<{ problem_slug: string }[]>`
    SELECT problem_slug FROM user_solved_problems WHERE user_id = ${userId}
  `

  return {
    user_id: member.user_id,
    username: member.username,
    display_name: member.display_name,
    avatar_url: member.avatar_url,
    solved_slugs: solved.map(s => s.problem_slug),
    solved_count: solved.length,
  }
}
