import { useCallback, useEffect, useRef, useState } from 'react'
import { Moon } from 'lucide-react'
import { getWeather, isCanceled } from './lib/api'
import {
  DEFAULT_CITY,
  DEFAULT_REMINDER,
  MAX_FAVOURITES,
  MESSAGES,
  STORAGE_KEYS,
  UNIT_LABELS,
} from './lib/constants'
import type {
  ApiError,
  City,
  Favourite,
  PreviewState,
  Unit,
  WeatherSnapshot,
} from './lib/types'
import { isSameCity, readStorage, writeStorage } from './lib/utils'
import {
  FetchError,
  NoticeBanner,
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

type WeatherStatus = 'loading' | 'ready' | 'error'

/** Stored values are untrusted: a blocked or hand-edited value must not crash the app. */
function loadFavourites(): Favourite[] {
  const stored = readStorage<Favourite[]>(STORAGE_KEYS.favourites)
  if (!Array.isArray(stored)) return []
  return stored.filter((item) => Boolean(item?.city?.name)).slice(0, MAX_FAVOURITES)
}

export default function App() {
  const [preview, setPreview] = useState<PreviewState>('live')
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [city, setCity] = useState<City>(DEFAULT_CITY)
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('loading')
  const [weatherError, setWeatherError] = useState('')
  const [favourites, setFavourites] = useState<Favourite[]>(loadFavourites)
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [notice, setNotice] = useState('')
  const requestRef = useRef<AbortController | null>(null)
  const unit: Unit = 'celsius'

  const loadWeather = useCallback(async (nextCity: City) => {
    /* A newer selection wins: cancel the request that is still in flight. */
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setCity(nextCity)
    setNotice('')
    setWeatherStatus('loading')
    setWeatherError('')

    try {
      const snapshot = await getWeather(nextCity, controller.signal)
      if (controller.signal.aborted) return

      setWeather(snapshot)
      setWeatherStatus('ready')
      writeStorage(STORAGE_KEYS.lastCity, nextCity)
    } catch (error) {
      if (isCanceled(error) || controller.signal.aborted) return

      setWeatherError((error as ApiError).message || MESSAGES.network)
      setWeatherStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    requestRef.current = controller

    async function loadInitialWeather() {
      try {
        const snapshot = await getWeather(DEFAULT_CITY, controller.signal)
        if (controller.signal.aborted) return

        setWeather(snapshot)
        setWeatherStatus('ready')
        writeStorage(STORAGE_KEYS.lastCity, DEFAULT_CITY)
      } catch (error) {
        if (isCanceled(error) || controller.signal.aborted) return

        setWeatherError((error as ApiError).message || MESSAGES.network)
        setWeatherStatus('error')
      }
    }

    void loadInitialWeather()
    return () => controller.abort()
  }, [])

  const isLoading = preview === 'loading' || (preview !== 'error' && weatherStatus === 'loading')
  const isError = preview === 'error' || weatherStatus === 'error'
  const isFavourite = weather
    ? favourites.some((item) => isSameCity(item.city, weather.city))
    : false

  function retryWeather() {
    if (preview === 'error') {
      setPreview('live')
      return
    }
    void loadWeather(city)
  }

  /* Storage failures keep working in memory for this session and show a notice. */
  function persistFavourites(next: Favourite[]) {
    setFavourites(next)
    setStorageBlocked(!writeStorage(STORAGE_KEYS.favourites, next))
  }

  function removeFavourite(cityToRemove: City) {
    if (!window.confirm(`Remove ${cityToRemove.name} from your favourites?`)) return

    persistFavourites(favourites.filter((item) => !isSameCity(item.city, cityToRemove)))
    setNotice('')
  }

  function toggleFavourite() {
    if (!weather) return

    if (isFavourite) {
      removeFavourite(weather.city)
      return
    }

    if (favourites.length >= MAX_FAVOURITES) {
      setNotice(MESSAGES.favouritesFull)
      return
    }

    persistFavourites([...favourites, { city: weather.city, addedAt: Date.now() }])
    setNotice('')
  }

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1920px] flex-col lg:flex-row">
        <Sidebar
          favourites={favourites}
          reminder={DEFAULT_REMINDER}
          activeCity={weather?.city}
          storageBlocked={storageBlocked}
          onSelectFavourite={(nextCity) => void loadWeather(nextCity)}
          onRemoveFavourite={removeFavourite}
        />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <SearchBar onSelect={(nextCity) => void loadWeather(nextCity)} />

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
            {notice && (
              <div className="mb-5">
                <NoticeBanner message={notice} />
              </div>
            )}

            {preview === 'offline' && (
              <div className="mb-5">
                <OfflineBanner updatedAt={weather?.current.updatedAt} />
              </div>
            )}

            {preview === 'blocked' && (
              <div className="mb-5">
                <NotificationBlockedBanner />
              </div>
            )}

            {isLoading ? (
              <WeatherSkeleton />
            ) : isError ? (
              <FetchError
                message={preview === 'error' ? MESSAGES.network : weatherError}
                onRetry={retryWeather}
              />
            ) : (
              weather && (
                <>
                  <CurrentWeather
                    city={weather.city}
                    current={weather.current}
                    unit={unit}
                    isFavourite={isFavourite}
                    onToggleFavourite={toggleFavourite}
                  />

                  <StatsCard current={weather.current} unit={unit} />

                  <ForecastList forecast={weather.forecast} unit={unit} />
                </>
              )
            )}

            <PreviewBar value={preview} onChange={setPreview} />
          </div>
        </main>
      </div>
    </div>
  )
}
