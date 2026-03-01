import sql from './connection.js'

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string | null
  type: string
  is_read: boolean
  created_at: Date
}

export async function getNotifications(userId: number, limit = 50): Promise<Notification[]> {
  if (!sql) return []

  return sql<Notification[]>`
    SELECT * FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
}

export async function getUnreadCount(userId: number): Promise<number> {
  if (!sql) return 0

  const [row] = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM notifications
    WHERE user_id = ${userId} AND is_read = FALSE
  `
  return parseInt(row?.count || '0', 10)
}

export async function createNotification(
  userId: number,
  title: string,
  message?: string,
  type = 'info'
): Promise<Notification> {
  if (!sql) throw new Error('Database not configured')

  const [notification] = await sql<Notification[]>`
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (${userId}, ${title}, ${message || null}, ${type})
    RETURNING *
  `
  return notification
}

export async function markNotificationRead(id: number, userId: number): Promise<Notification | null> {
  if (!sql) return null

  const [notification] = await sql<Notification[]>`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `
  return notification || null
}

export async function markAllNotificationsRead(userId: number): Promise<number> {
  if (!sql) return 0

  const result = await sql`
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = ${userId} AND is_read = FALSE
  `
  return result.count
}

export async function deleteNotification(id: number, userId: number): Promise<boolean> {
  if (!sql) return false

  const result = await sql`
    DELETE FROM notifications
    WHERE id = ${id} AND user_id = ${userId}
  `
  return result.count > 0
}
