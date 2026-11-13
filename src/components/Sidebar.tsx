import { useRef, useState } from 'react'
import { ChevronDown, Clock, CloudSun, Star, X } from 'lucide-react'
import { MAX_FAVOURITES, MESSAGES } from '../lib/constants'
import type { NotificationState } from '../lib/notifications'
import type { City, Favourite, Reminder } from '../lib/types'
import { cn, formatReminderTime, isSameCity } from '../lib/utils'

interface SidebarProps {
  favourites: Favourite[]
  reminder: Reminder
  notificationState: NotificationState
  activeCity?: City
  storageBlocked: boolean
  onSelectFavourite: (city: City) => void
  onRemoveFavourite: (city: City) => void
  onEnableReminder: () => void
  onDisableReminder: () => void
  onTimeChange: (time: string) => void
}

export function Sidebar({
  favourites,
  reminder,
  notificationState,
  activeCity,
  storageBlocked,
  onSelectFavourite,
  onRemoveFavourite,
  onEnableReminder,
  onDisableReminder,
  onTimeChange,
}: SidebarProps) {
  /* Mobile keeps the panel collapsed; the chevron is the only way in. */
  const [isOpen, setIsOpen] = useState(false)
  /* The permission explanation must appear before the browser's own prompt. */
  const [showReminderIntro, setShowReminderIntro] = useState(false)
  const timeInputRef = useRef<HTMLInputElement>(null)

  function handleReminderToggle() {
    if (reminder.enabled) {
      onDisableReminder()
      return
    }
    if (notificationState === 'default') {
      setShowReminderIntro(true)
      return
    }
    onEnableReminder()
  }

  /* Chrome/Safari only open the picker reliably through showPicker(). */
  function openTimePicker() {
    const input = timeInputRef.current
    if (!input) return

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker()
        return
      } catch {
        // Fall through to focus if the browser rejects the programmatic picker.
      }
    }

    input.focus()
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-panel px-5 py-5 lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
            <CloudSun size={20} strokeWidth={1.8} />
          </span>
          <span className="font-display text-2xl tracking-tight">WeatherBoard</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="sidebar-details"
          aria-label={isOpen ? 'Hide favourites and reminder' : 'Show favourites and reminder'}
          className="grid size-11 place-items-center rounded-lg border border-line bg-card lg:hidden"
        >
          <ChevronDown
            size={18}
            className={cn('transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div id="sidebar-details" className={cn('lg:block', isOpen ? 'block' : 'hidden')}>
        {/* Reminder comes first because it is the only time-sensitive setting. */}
        <div className="mt-8">
          <p className="text-xs font-medium text-muted">Morning reminder</p>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Daily forecast</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Sent even when the app is closed.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              onClick={handleReminderToggle}
              aria-checked={reminder.enabled}
              aria-label="Daily forecast reminder"
              className="relative -m-2.5 mt-[-0.375rem] shrink-0 rounded-full p-2.5"
            >
              <span
                className={cn(
                  'block h-6 w-11 rounded-full transition-colors',
                  reminder.enabled ? 'bg-brand' : 'bg-line',
                )}
              >
                <span
                  className={cn(
                    'block size-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform',
                    reminder.enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>
          </div>

          {notificationState === 'denied' && (
            <p className="mt-2 text-xs leading-relaxed text-danger">
              {MESSAGES.notificationsBlocked}
            </p>
          )}

          {notificationState === 'unsupported' && (
            <p className="mt-2 text-xs leading-relaxed text-danger">
              {MESSAGES.notificationsUnsupported}
            </p>
          )}

          {showReminderIntro && (
            <div className="mt-3 rounded-xl border border-line bg-card p-3">
              <p className="text-xs leading-relaxed text-muted">
                WeatherBoard will ask for notification permission, then send one reminder a
                day at {formatReminderTime(reminder.time)}. It can appear while the tab is
                closed, and you can turn it off anytime.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderIntro(false)
                    onEnableReminder()
                  }}
                  className="min-h-11 rounded-lg bg-ink px-3 text-xs font-medium text-page"
                >
                  Allow notifications
                </button>
                <button
                  type="button"
                  onClick={() => setShowReminderIntro(false)}
                  className="min-h-11 rounded-lg border border-line px-3 text-xs font-medium"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm">Remind me at</span>
            <div className="relative">
              <button
                type="button"
                onClick={openTimePicker}
                aria-label={`Change reminder time, currently ${formatReminderTime(reminder.time)}`}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-medium tabular-nums shadow-sm transition-colors hover:border-muted/50 hover:bg-panel"
              >
                <Clock size={15} className="text-muted" aria-hidden="true" />
                <span>{formatReminderTime(reminder.time)}</span>
                <ChevronDown size={14} className="text-muted" aria-hidden="true" />
              </button>
              {/*
                The input covers the button so the native picker opens next to it
                instead of at the top-left of the page.
              */}
              <input
                ref={timeInputRef}
                type="time"
                value={reminder.time}
                onChange={(event) => onTimeChange(event.target.value)}
                aria-hidden="true"
                tabIndex={-1}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
              />
            </div>
          </div>
        </div>

        <div className="mt-9">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted">Favourites</h2>
            <span className="text-xs tabular-nums text-muted">
              {favourites.length} of {MAX_FAVOURITES}
            </span>
          </div>

          {favourites.length === 0 ? (
            <div className="mt-3 rounded-xl border border-line bg-card px-4 py-6 text-center">
              <p className="text-sm font-semibold">No favourites yet</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Save a city with the star button to see it here.
              </p>
            </div>
          ) : (
            /* Highlight the city currently shown so quick access stays obvious. */
            <ul className="mt-3 space-y-1">
              {favourites.map(({ city }) => {
                const isActive = activeCity ? isSameCity(city, activeCity) : false

                return (
                  <li
                    key={`${city.name}-${city.lat}`}
                    className={cn(
                      'flex items-center rounded-lg transition-colors',
                      isActive ? 'bg-card' : 'hover:bg-card',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectFavourite(city)}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2 text-left"
                    >
                      <Star
                        size={14}
                        className={cn('shrink-0', isActive ? 'text-sun' : 'text-muted')}
                        fill={isActive ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{city.name}</span>
                        <span className="block truncate text-[11px] text-muted">
                          {city.country}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveFavourite(city)}
                      aria-label={`Remove ${city.name} from favourites`}
                      className="grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-danger"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {storageBlocked && (
            <p role="status" className="mt-2 text-xs leading-relaxed text-danger">
              {/* Writes failed, but the in-memory list keeps working this session. */}
              {MESSAGES.storageBlocked}
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
