import { useState } from 'react'
import { Moon } from 'lucide-react'
import { DEFAULT_CITY, DEFAULT_REMINDER, UNIT_LABELS } from './constants'
import {
  FetchError,
  NotificationBlockedBanner,
  OfflineBanner,
  PreviewBar,
  WeatherSkeleton,
} from './components/Banners'
import { CurrentWeather } from './components/CurrentWeather'
import { ForecastList } from './components/ForecastList'
import { SearchBar } from './components/SearchBar'
import { Sidebar } from './components/Sidebar'
import { StatsCard } from './components/StatsCard'
import type { PreviewState, Unit, WeatherSnapshot } from './types'

/* Temporary data for the static UI step; replaced by real API data in Step 4. */
const MOCK_WEATHER: WeatherSnapshot = {
  city: { ...DEFAULT_CITY, id: 'mock-karachi' },
  current: {
    tempC: 31,
    feelsLikeC: 33,
    humidity: 64,
    windKph: 14,
    condition: 'clear',
    icon: 'sun',
    highC: 33,
    lowC: 25,
    updatedAt: Date.now(),
  },
  forecast: [
    { date: '2026-11-13', condition: 'clear', icon: 'sun', minC: 25, maxC: 33 },
    { date: '2026-11-14', condition: 'partly', icon: 'partly', minC: 25, maxC: 32 },
    { date: '2026-11-15', condition: 'clear', icon: 'sun', minC: 26, maxC: 34 },
    { date: '2026-11-16', condition: 'cloudy', icon: 'cloud', minC: 25, maxC: 31 },
    { date: '2026-11-17', condition: 'rain', icon: 'rain', minC: 24, maxC: 29 },
  ],
}

export default function App() {
  const [preview, setPreview] = useState<PreviewState>('live')
  const weather = MOCK_WEATHER
  const unit: Unit = 'celsius'

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col lg:flex-row">
        <Sidebar favourites={[]} reminder={DEFAULT_REMINDER} />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchBar />

            <div className="flex items-center gap-2.5">
              <div className="flex items-center rounded-lg border border-line bg-card p-1 shadow-card">
                <button
                  type="button"
                  aria-pressed="true"
                  className="min-h-11 min-w-11 rounded-md bg-ink px-3 text-xs font-semibold text-page"
                >
                  {UNIT_LABELS.celsius}
                </button>
                <button
                  type="button"
                  aria-pressed="false"
                  className="min-h-11 min-w-11 rounded-md px-3 text-xs font-medium text-muted"
                >
                  {UNIT_LABELS.fahrenheit}
                </button>
              </div>

              <button
                type="button"
                aria-label="Switch to dark mode"
                className="grid size-11 place-items-center rounded-lg border border-line bg-card text-ink shadow-card"
              >
                <Moon size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="mx-auto mt-8 w-full max-w-[1480px] lg:mt-12">
            {preview === 'offline' && (
              <div className="mb-5">
                <OfflineBanner updatedAt={weather.current.updatedAt} />
              </div>
            )}

            {preview === 'blocked' && (
              <div className="mb-5">
                <NotificationBlockedBanner />
              </div>
            )}

            {preview === 'loading' ? (
              <WeatherSkeleton />
            ) : preview === 'error' ? (
              <FetchError onRetry={() => setPreview('live')} />
            ) : (
              <>
                <CurrentWeather
                  city={weather.city}
                  current={weather.current}
                  unit={unit}
                  isFavourite={false}
                />

                <StatsCard current={weather.current} unit={unit} />

                <ForecastList forecast={weather.forecast} unit={unit} />
              </>
            )}

            <PreviewBar value={preview} onChange={setPreview} />
          </div>
        </main>
      </div>
    </div>
  )
}
