import type { CurrentWeather, Unit } from '../lib/types'
import { toDisplayTemp, toDisplayWind } from '../lib/utils'

interface StatsCardProps {
  current: CurrentWeather
  unit: Unit
}

export function StatsCard({ current, unit }: StatsCardProps) {
  /* Stored values stay Celsius; conversion happens only for display. */
  const wind = toDisplayWind(current.windKph, unit)

  const stats = [
    { label: 'Humidity', value: `${current.humidity}%` },
    { label: 'Wind', value: `${wind.value} ${wind.label}` },
    { label: 'High', value: `${toDisplayTemp(current.highC, unit)}°` },
    { label: 'Low', value: `${toDisplayTemp(current.lowC, unit)}°` },
  ]

  return (
    <section className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line shadow-card md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-5 py-4">
          <p className="text-xs text-muted">{stat.label}</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}
