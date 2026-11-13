import { useState } from 'react'
import { ChevronDown, Clock, CloudSun, Star } from 'lucide-react'
import { MAX_FAVOURITES } from '../constants'
import type { Favourite, Reminder } from '../types'
import { cn, formatReminderTime } from '../utils'

interface SidebarProps {
  favourites: Favourite[]
  reminder: Reminder
}

export function Sidebar({ favourites, reminder }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

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
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm transition-colors hover:bg-card"
                >
                  <Star size={14} className="text-sun" fill="currentColor" />
                  <span className="truncate">{favourite.city.name}</span>
                  <span className="ml-auto truncate text-xs text-muted">
                    {favourite.city.country}
                  </span>
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
      </div>
    </aside>
  )
}
