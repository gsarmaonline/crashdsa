import { Hono } from 'hono'
import type { AuthVariables } from '../auth/middleware.js'
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../db/notifications.js'

const notifications = new Hono<{ Variables: AuthVariables }>()

// Get user's notifications (paginated)
notifications.get('/api/user/notifications', async (c) => {
  const user = c.get('user')!
  const limitParam = c.req.query('limit')
  const offsetParam = c.req.query('offset')
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100) : 20
  const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0

  const items = await getUserNotifications(user.id, limit, offset)
  return c.json({ notifications: items })
})

// Get unread notification count
notifications.get('/api/user/notifications/unread-count', async (c) => {
  const user = c.get('user')!
  const count = await getUnreadNotificationCount(user.id)
  return c.json({ count })
})

// Create a notification for the authenticated user
notifications.post('/api/user/notifications', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ type?: string; title?: string; message?: string }>()

  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: 'title is required' }, 400)
  }
  if (!body.message || body.message.trim().length === 0) {
    return c.json({ error: 'message is required' }, 400)
  }
  if (body.title.length > 255) {
    return c.json({ error: 'title must be 255 characters or less' }, 400)
  }

  const type = body.type?.trim() || 'info'
  const notification = await createNotification(user.id, type, body.title.trim(), body.message.trim())
  return c.json({ notification }, 201)
})

// Mark a single notification as read
notifications.patch('/api/user/notifications/:id/read', async (c) => {
  const user = c.get('user')!
  const notificationId = parseInt(c.req.param('id'), 10)
  if (isNaN(notificationId)) return c.json({ error: 'Invalid notification ID' }, 400)

  const notification = await markNotificationRead(notificationId, user.id)
  if (!notification) return c.json({ error: 'Notification not found or already read' }, 404)

  return c.json({ notification })
})

// Mark all notifications as read
notifications.patch('/api/user/notifications/read-all', async (c) => {
  const user = c.get('user')!
  const updated = await markAllNotificationsRead(user.id)
  return c.json({ updated })
})

// Delete a notification
notifications.delete('/api/user/notifications/:id', async (c) => {
  const user = c.get('user')!
  const notificationId = parseInt(c.req.param('id'), 10)
  if (isNaN(notificationId)) return c.json({ error: 'Invalid notification ID' }, 400)

  const deleted = await deleteNotification(notificationId, user.id)
  if (!deleted) return c.json({ error: 'Notification not found' }, 404)

  return c.json({ deleted: true })
})

export default notifications
