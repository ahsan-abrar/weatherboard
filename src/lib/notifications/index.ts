import type { Reminder } from '../types'
import { formatReminderTime } from '../utils'

/** Shared with the service worker so two schedulers cannot both notify. */
const REMINDER_DB = 'weatherboard'
const REMINDER_STORE = 'reminder'
const REMINDER_KEY = 'daily'
const NOTIFICATION_GAP_MS = 2 * 60 * 1000

/** Notifications can be unavailable, or allowed/denied by the browser. */
export type NotificationState = NotificationPermission | 'unsupported'

function openReminderDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(REMINDER_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(REMINDER_STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Atomically claim today's notification slot. The page timer and worker timer
 * can fire together; only one should actually show a notification.
 */
export async function claimNotificationSlot() {
  try {
    const database = await openReminderDatabase()
    const claimed = await new Promise<boolean>((resolve) => {
      const transaction = database.transaction(REMINDER_STORE, 'readwrite')
      const store = transaction.objectStore(REMINDER_STORE)
      const request = store.get(REMINDER_KEY)

      request.onsuccess = () => {
        const record = request.result
        const now = Date.now()

        if (record && now - (record.lastShown || 0) < NOTIFICATION_GAP_MS) {
          resolve(false)
          return
        }

        store.put({ ...(record ?? {}), lastShown: now }, REMINDER_KEY)
        resolve(true)
      }
      request.onerror = () => resolve(true)
    })

    database.close()
    return claimed
  } catch {
    // If storage is unavailable, still allow the notification.
    return true
  }
}

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

/** Milliseconds until the next local occurrence of a stored "HH:MM". */
export function millisecondsUntil(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date(now)
  next.setHours(hours, minutes, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Show the daily reminder from the page while the tab is open. */
export async function showDailyReminderNotification() {
  if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false

  if (!(await claimNotificationSlot())) return false

  await registration.showNotification('WeatherBoard — daily forecast', {
    body: 'Your morning weather check is ready. Open WeatherBoard for today’s forecast.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'weatherboard-daily',
    data: { url: '/' },
  })

  // Keep the worker's last-shown marker in sync so it does not repeat today's reminder.
  registration.active?.postMessage({ type: 'reminder-shown' })
  return true
}

/**
 * Chromium can wake the service worker periodically for installed PWAs.
 * This is best-effort; unsupported browsers simply skip it.
 */
export async function registerPeriodicReminderSync() {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration?.periodicSync) return

  try {
    await registration.periodicSync.register('weatherboard-reminder', {
      minInterval: 15 * 60 * 1000,
    })
  } catch {
    // Requires an installed app and browser support.
  }
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
