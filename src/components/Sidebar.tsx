import { useState } from 'react'
import { ChevronDown, Clock, CloudSun, Star, X } from 'lucide-react'
import { MAX_FAVOURITES, MESSAGES } from '../lib/constants'
import type { City, Favourite, Reminder } from '../lib/types'
import { cn, formatReminderTime, isSameCity } from '../lib/utils'

interface SidebarProps {
  favourites: Favourite[]
  reminder: Reminder
  activeCity?: City
  storageBlocked: boolean
  onSelectFavourite: (city: City) => void
  onRemoveFavourite: (city: City) => void
}

export function Sidebar({
  favourites,
  reminder,
  activeCity,
  storageBlocked,
  onSelectFavourite,
  onRemoveFavourite,
}: SidebarProps) {
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
                      <span className="block truncate text-[11px] text-muted">{city.country}</span>
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
            {MESSAGES.storageBlocked}
          </p>
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
