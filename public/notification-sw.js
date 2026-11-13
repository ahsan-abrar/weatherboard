/*
 * WeatherBoard notification helpers, imported by the generated service worker.
 * Client-only apps cannot guarantee delivery when the browser is fully closed;
 * this keeps a timer while the worker is alive, catches up missed reminders on
 * restart, and uses periodic background sync where the browser supports it.
 */

const DB_NAME = 'weatherboard'
const STORE_NAME = 'reminder'
const REMINDER_KEY = 'daily'
const ICON = '/icons/icon-192.png'
/* Page and worker can fire together; only one claims the slot. */
const NOTIFICATION_GAP_MS = 30 * 1000

let reminderTimer = null
let resumeInFlight = null

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

/** Atomically claim the notification slot so page + worker do not both show. */
async function claimNotificationSlot() {
  try {
    const database = await openDatabase()
    const claimed = await new Promise((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
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
    return true
  }
}

/** Today's reminder moment in the user's local timezone. */
function targetForToday(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  return target
}

/** Milliseconds until the next occurrence of the stored "HH:MM" time. */
function nextReminderDelay(time) {
  const target = targetForToday(time)
  if (target <= new Date()) target.setDate(target.getDate() + 1)
  return target.getTime() - Date.now()
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

async function markShown(reminder) {
  const updated = { ...reminder, lastShown: Date.now() }
  try {
    await saveReminder(updated)
  } catch {
    // The in-memory timer still works even if storage is unavailable.
  }
  return updated
}

/**
 * A worker that starts after the scheduled time should still show the missed
 * reminder once. `changedAt` prevents an old time from firing after an edit.
 */
async function showIfDue(reminder) {
  if (!reminder?.enabled || !reminder.time) return reminder

  const target = targetForToday(reminder.time)
  const now = Date.now()
  const changedAt = reminder.changedAt || 0
  const lastShown = reminder.lastShown || 0

  if (now < target.getTime()) return reminder
  if (target.getTime() <= changedAt) return reminder
  if (lastShown >= target.getTime()) return reminder
  if (!(await claimNotificationSlot())) return reminder

  try {
    await showDailyNotification()
  } catch {
    // Permission may have been revoked; the app can explain it on next visit.
  }

  return markShown(reminder)
}

function clearReminderTimer() {
  if (reminderTimer) clearTimeout(reminderTimer)
  reminderTimer = null
}

function scheduleReminder(reminder) {
  clearReminderTimer()
  if (!reminder?.enabled || !reminder.time) return

  const run = async () => {
    if (await claimNotificationSlot()) {
      try {
        await showDailyNotification()
      } catch {
        // Permission may have been revoked; the app can explain it on next visit.
      }

      await markShown(reminder)
    }

    reminderTimer = setTimeout(run, nextReminderDelay(reminder.time))
  }

  reminderTimer = setTimeout(run, nextReminderDelay(reminder.time))
}

/** Called on activation, worker start and periodic sync. */
function resumeReminder() {
  if (resumeInFlight) return resumeInFlight

  resumeInFlight = loadReminder()
    .then(showIfDue)
    .then(scheduleReminder)
    .catch(() => {
      // No saved reminder yet; nothing to resume.
    })
    .finally(() => {
      resumeInFlight = null
    })

  return resumeInFlight
}

self.addEventListener('message', (event) => {
  const message = event.data

  if (message?.type === 'reminder-shown') {
    event.waitUntil(
      loadReminder()
        .then((reminder) => (reminder ? markShown(reminder) : undefined))
        .catch(() => {}),
    )
    return
  }

  if (message?.type !== 'schedule-reminder') return

  event.waitUntil(
    (async () => {
      let previous = null
      try {
        previous = await loadReminder()
      } catch {
        // Continue with a fresh record if storage is unavailable.
      }

      const enabled = Boolean(message.enabled)
      const changed =
        !previous || previous.time !== message.time || Boolean(previous.enabled) !== enabled
      const reminder = {
        enabled,
        time: message.time,
        // Preserve lastShown/changedAt when the app re-syncs the same values.
        changedAt: changed ? Date.now() : previous?.changedAt || 0,
        lastShown: previous?.lastShown || 0,
      }

      try {
        await saveReminder(reminder)
      } catch {
        // IndexedDB can be unavailable in private modes; still schedule in memory.
      }

      scheduleReminder(reminder)
    })(),
  )
})

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'weatherboard-reminder') {
    event.waitUntil(resumeReminder())
  }
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
  event.waitUntil(resumeReminder())
})

// A fresh worker start (message, fetch, browser restart) also catches up.
resumeReminder()
