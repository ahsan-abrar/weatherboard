import type { Reminder } from '../types'
import { formatReminderTime } from '../utils'

/** Notifications can be unavailable, or allowed/denied by the browser. */
export type NotificationState = NotificationPermission | 'unsupported'

export function getNotificationState(): NotificationState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/**
 * Browsers only show the permission prompt after a user action and never
 * twice after a denial, so the UI explains the request before calling this.
 */
export async function requestNotificationPermission(): Promise<NotificationState> {
  if (typeof Notification === 'undefined') return 'unsupported'

  try {
    // Always call the browser API from the user's click; it decides the outcome.
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Send the current reminder to the service worker so it can schedule it. */
export async function syncReminderWithWorker(reminder: Reminder) {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration()
  registration?.active?.postMessage({
    type: 'schedule-reminder',
    enabled: reminder.enabled,
    time: reminder.time,
  })
}

/** A test proves permission and the service worker are both working. */
export async function showTestNotification(reminder: Reminder) {
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false

  await registration.showNotification('WeatherBoard reminder', {
    body: `Your daily forecast reminder is set for ${formatReminderTime(reminder.time)}.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'weatherboard-test',
    data: { url: '/' },
  })
  return true
}
