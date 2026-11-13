import type { Unit } from './types'

/** Join class names, skipping falsy values (keeps JSX readable). */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/*
 * Storage can throw: Safari private mode, blocked cookies, quota errors.
 * These helpers return a safe fallback so the app never crashes over storage.
 */
export function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing useful to do if removal is blocked.
  }
}

/** All weather is kept in Celsius; conversion happens only for display. */
export function toDisplayTemp(celsius: number, unit: Unit) {
  return Math.round(unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius)
}

export function toDisplayWind(kph: number, unit: Unit) {
  return {
    value: Math.round(unit === 'fahrenheit' ? kph * 0.621371 : kph),
    label: unit === 'fahrenheit' ? 'mph' : 'km/h',
  }
}

/** "Today", then weekday names, for the forecast rows. */
export function formatForecastDay(date: string, index: number) {
  if (index === 0) return 'Today'
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "07:30" (24h, stored) -> "07:30 AM" (label). */
export function formatReminderTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`
}

/** Keep calls from firing on every keystroke. */
export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined

  return (...args: Args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
