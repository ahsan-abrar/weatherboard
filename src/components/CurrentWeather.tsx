import { MapPin, Star } from 'lucide-react'
import { CONDITIONS, UNIT_LABELS } from '../lib/constants'
import type { City, CurrentWeather as CurrentWeatherType, Unit } from '../lib/types'
import { cn, toDisplayTemp } from '../lib/utils'
import { WeatherIcon } from './WeatherIcon'

interface CurrentWeatherProps {
  city: City
  current: CurrentWeatherType
  unit: Unit
  isFavourite: boolean
  onToggleFavourite: () => void
}

export function CurrentWeather({
  city,
  current,
  unit,
  isFavourite,
  onToggleFavourite,
}: CurrentWeatherProps) {
  /* Both providers map their codes to the shared condition keys in constants. */
  const condition = CONDITIONS[current.condition as keyof typeof CONDITIONS] ?? CONDITIONS.clear
  const temperature = toDisplayTemp(current.tempC, unit)

  return (
    <section className="flex flex-col gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-y-6 xl:gap-12">
      <div className="shrink-0">
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin size={14} aria-hidden="true" />
          {city.country}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
            {city.name}
          </h1>
          {/* Toggling off asks for confirmation through the App handler. */}
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-pressed={isFavourite}
            title={isFavourite ? 'Remove from favourites' : 'Save this city'}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-full border px-4 text-base transition-colors',
              isFavourite
                ? 'border-sun/50 bg-sun/10 text-sun'
                : 'border-line bg-card shadow-card hover:bg-panel',
            )}
          >
            <Star size={18} fill={isFavourite ? 'currentColor' : 'none'} aria-hidden="true" />
            {isFavourite ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        <div className="flex items-start">
          <span className="font-display text-[clamp(96px,11vw,180px)] leading-[0.72] tracking-[-0.04em] tabular-nums">
            {temperature}
          </span>
          <span className="mt-2 font-sans text-2xl font-medium sm:mt-4 sm:text-3xl">
            {UNIT_LABELS[unit]}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <WeatherIcon name={current.icon} size={56} className="animate-weather text-sun" />
          <div>
            <p className="text-xl font-semibold">{condition.label}</p>
            <p className="mt-0.5 text-sm text-muted">
              Feels like {toDisplayTemp(current.feelsLikeC, unit)}°
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
