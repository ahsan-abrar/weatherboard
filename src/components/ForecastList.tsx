import { CONDITIONS } from '../lib/constants'
import type { ForecastDay, Unit } from '../lib/types'
import { formatForecastDay, toDisplayTemp } from '../lib/utils'
import { WeatherIcon } from './WeatherIcon'

interface ForecastListProps {
  forecast: ForecastDay[]
  unit: Unit
}

/** Place every day's range inside the window shared by all five days. */
function getRangePosition(day: ForecastDay, forecast: ForecastDay[]) {
  const values = forecast.flatMap((item) => [item.minC, item.maxC])
  const lowest = Math.min(...values)
  const highest = Math.max(...values)
  const span = highest - lowest || 1

  return {
    left: ((day.minC - lowest) / span) * 100,
    width: ((day.maxC - day.minC) / span) * 100,
  }
}

export function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-3xl">Next 5 days</h2>

      {/* One shared window keeps every day's bar comparable. */}
      <div className="mt-3">
        {forecast.map((day, index) => {
          const condition = CONDITIONS[day.condition as keyof typeof CONDITIONS] ?? CONDITIONS.clear
          const range = getRangePosition(day, forecast)

          return (
            <div
              key={day.date}
              className="grid grid-cols-[48px_22px_minmax(76px,1fr)_30px_minmax(56px,1.4fr)_30px] items-center gap-3 border-b border-line/80 py-3.5 last:border-b-0 sm:grid-cols-[64px_24px_140px_36px_minmax(80px,2fr)_36px] sm:gap-4"
            >
              <span className="text-xs font-semibold sm:text-sm">
                {formatForecastDay(day.date, index)}
              </span>

              <WeatherIcon name={day.icon} size={22} className="text-sun" />

              <span className="truncate text-xs text-muted sm:text-sm">{condition.label}</span>

              <span className="text-right text-xs tabular-nums text-muted sm:text-sm">
                {toDisplayTemp(day.minC, unit)}°
              </span>

              <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cool via-mid to-warm"
                  style={{ marginLeft: `${range.left}%`, width: `${range.width}%` }}
                />
              </div>

              <span className="text-right text-xs font-medium tabular-nums sm:text-sm">
                {toDisplayTemp(day.maxC, unit)}°
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
