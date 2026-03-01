import { Hono } from 'hono'
import type { AuthVariables } from '../auth/middleware.js'
import {
  getNotifications,
  getUnreadCount,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../db/notifications.js'

const notifications = new Hono<{ Variables: AuthVariables }>()

// List notifications for current user
notifications.get('/api/user/notifications', async (c) => {
  const user = c.get('user')!
  const limitParam = c.req.query('limit')
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200) : 50

  const [items, unread_count] = await Promise.all([
    getNotifications(user.id, limit),
    getUnreadCount(user.id),
  ])

  return c.json({ notifications: items, unread_count })
})

// Create a notification for the current user
notifications.post('/api/user/notifications', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ title?: string; message?: string; type?: string }>()

  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: 'title is required' }, 400)
  }
  if (body.title.length > 500) {
    return c.json({ error: 'title must be 500 characters or less' }, 400)
  }

  const validTypes = ['info', 'success', 'warning', 'error']
  const type = body.type && validTypes.includes(body.type) ? body.type : 'info'

  const notification = await createNotification(user.id, body.title.trim(), body.message?.trim(), type)
  return c.json({ notification }, 201)
})

// Mark all notifications as read
notifications.patch('/api/user/notifications/read-all', async (c) => {
  const user = c.get('user')!
  const updated = await markAllNotificationsRead(user.id)
  return c.json({ updated })
})

// Mark a single notification as read
notifications.patch('/api/user/notifications/:id/read', async (c) => {
  const user = c.get('user')!
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'Invalid notification ID' }, 400)

  const notification = await markNotificationRead(id, user.id)
  if (!notification) return c.json({ error: 'Notification not found' }, 404)

  return c.json({ notification })
})

// Delete a notification
notifications.delete('/api/user/notifications/:id', async (c) => {
  const user = c.get('user')!
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'Invalid notification ID' }, 400)

  const deleted = await deleteNotification(id, user.id)
  if (!deleted) return c.json({ error: 'Notification not found' }, 404)

  return c.json({ deleted: true })
})

export default notifications
