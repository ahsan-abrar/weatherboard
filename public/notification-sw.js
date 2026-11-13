/*
 * WeatherBoard notification helpers, imported by the generated service worker.
 * A client-only app cannot wake itself when the browser is fully closed, so this
 * schedules the next reminder while the service worker is alive and catches up
 * the next time the app or browser starts.
 */

const DB_NAME = 'weatherboard'
const STORE_NAME = 'reminder'
const REMINDER_KEY = 'daily'
const ICON = '/icons/icon-192.png'

let reminderTimer = null

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveReminder(reminder) {
  const database = await openDatabase()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(reminder, REMINDER_KEY)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function loadReminder() {
  const database = await openDatabase()
  const reminder = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(REMINDER_KEY)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
  database.close()
  return reminder
}

/** Milliseconds until the next occurrence of the stored "HH:MM" time. */
function nextReminderDelay(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date(now)
  next.setHours(hours, minutes, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

function showDailyNotification() {
  return self.registration.showNotification('WeatherBoard — daily forecast', {
    body: 'Your morning weather check is ready. Open WeatherBoard for today’s forecast.',
    icon: ICON,
    badge: ICON,
    tag: 'weatherboard-daily',
    data: { url: '/' },
  })
}

function clearReminderTimer() {
  if (reminderTimer) clearTimeout(reminderTimer)
  reminderTimer = null
}

function scheduleReminder(reminder) {
  clearReminderTimer()
  if (!reminder?.enabled || !reminder.time) return

  const run = async () => {
    try {
      await showDailyNotification()
    } catch {
      // Permission may have been revoked; the next app visit can explain why.
    }
    reminderTimer = setTimeout(run, nextReminderDelay(reminder.time))
  }

  reminderTimer = setTimeout(run, nextReminderDelay(reminder.time))
}

self.addEventListener('message', (event) => {
  const message = event.data
  if (message?.type !== 'schedule-reminder') return

  const reminder = { enabled: Boolean(message.enabled), time: message.time }
  event.waitUntil(
    saveReminder(reminder)
      .then(() => scheduleReminder(reminder))
      .catch(() => {
        // IndexedDB can be unavailable in private modes; still schedule in memory.
        scheduleReminder(reminder)
      }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const existing = windows.find((client) => 'focus' in client)

      if (existing) {
        await existing.focus()
        // Bring an open tab back to the dashboard, not just any route.
        try {
          await existing.navigate(target)
        } catch {
          // Some clients cannot navigate; focus alone is still useful.
        }
        return
      }

      return self.clients.openWindow(target)
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    loadReminder()
      .then(scheduleReminder)
      .catch(() => {
        // No saved reminder yet; nothing to schedule.
      }),
  )
})

// A fresh service worker start (message, fetch, browser restart) resumes the timer.
loadReminder()
  .then(scheduleReminder)
  .catch(() => {})
