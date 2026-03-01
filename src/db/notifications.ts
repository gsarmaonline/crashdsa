import sql from './connection.js'

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  read_at: Date | null
  created_at: Date
}

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string
): Promise<Notification> {
  if (!sql) throw new Error('Database not configured')

  const [notification] = await sql<Notification[]>`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (${userId}, ${type}, ${title}, ${message})
    RETURNING *
  `
  return notification
}

export async function getUserNotifications(
  userId: number,
  limit = 20,
  offset = 0
): Promise<Notification[]> {
  if (!sql) return []

  return sql<Notification[]>`
    SELECT *
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  if (!sql) return 0

  const [row] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ${userId} AND read_at IS NULL
  `
  return parseInt(row.count, 10)
}

export async function markNotificationRead(
  notificationId: number,
  userId: number
): Promise<Notification | null> {
  if (!sql) throw new Error('Database not configured')

  const [notification] = await sql<Notification[]>`
    UPDATE notifications
    SET read_at = NOW()
    WHERE id = ${notificationId} AND user_id = ${userId} AND read_at IS NULL
    RETURNING *
  `
  return notification ?? null
}

export async function markAllNotificationsRead(userId: number): Promise<number> {
  if (!sql) throw new Error('Database not configured')

  const result = await sql<Notification[]>`
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = ${userId} AND read_at IS NULL
    RETURNING id
  `
  return result.length
}

export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<boolean> {
  if (!sql) throw new Error('Database not configured')

  const result = await sql`
    DELETE FROM notifications
    WHERE id = ${notificationId} AND user_id = ${userId}
    RETURNING id
  `
  return result.length > 0
}
