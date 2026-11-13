import { Clock, CloudSun, Star } from 'lucide-react'
import { MAX_FAVOURITES } from '../constants'
import type { Favourite, Reminder } from '../types'
import { cn, formatReminderTime } from '../utils'

interface SidebarProps {
  favourites: Favourite[]
  reminder: Reminder
}

export function Sidebar({ favourites, reminder }: SidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-panel px-5 py-6 md:sticky md:top-0 md:h-dvh md:w-72 md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
          <CloudSun size={20} strokeWidth={1.8} />
        </span>
        <span className="font-display text-2xl tracking-tight">WeatherBoard</span>
      </div>

      <div className="mt-8 flex items-center justify-between">
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
        <ul className="mt-3 space-y-1">
          {favourites.map((favourite) => (
            <li key={`${favourite.city.name}-${favourite.city.lat}`}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-card"
              >
                <Star size={14} className="text-sun" fill="currentColor" />
                <span className="truncate">{favourite.city.name}</span>
                <span className="ml-auto truncate text-xs text-muted">{favourite.city.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-9">
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
            aria-checked={reminder.enabled}
            aria-label="Daily forecast reminder"
            className={cn(
              'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
              reminder.enabled ? 'bg-brand' : 'bg-line',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                reminder.enabled && 'translate-x-5',
              )}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm">Remind me at</span>
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm tabular-nums"
          >
            {formatReminderTime(reminder.time)}
            <Clock size={15} className="text-muted" />
          </button>
        </div>
      </div>
    </aside>
  )
}
