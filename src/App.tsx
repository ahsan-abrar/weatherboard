import { useCallback, useEffect, useRef, useState } from 'react'
import { Sun, Moon, Download } from 'lucide-react'
import { getWeather, isCanceled, readCachedWeather } from './lib/api'
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
  Settings,
  Unit,
  WeatherSnapshot,
} from './lib/types'
import { cn, isSameCity, readStorage, writeStorage } from './lib/utils'
import {
  FetchError,
  NoticeBanner,
  NotificationBlockedBanner,
  OfflineBanner,
  OfflineEmpty,
  PreviewBar,
  WeatherSkeleton,
} from './components/Banners'
import { CurrentWeather } from './components/CurrentWeather'
import { ForecastList } from './components/ForecastList'
import { SearchBar } from './components/SearchBar'
import { Sidebar } from './components/Sidebar'
import { StatsCard } from './components/StatsCard'

type WeatherStatus = 'loading' | 'ready' | 'error'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Stored values are untrusted: a blocked or hand-edited value must not crash the app. */
function loadFavourites(): Favourite[] {
  const stored = readStorage<Favourite[]>(STORAGE_KEYS.favourites)
  if (!Array.isArray(stored)) return []
  return stored.filter((item) => Boolean(item?.city?.name)).slice(0, MAX_FAVOURITES)
}

function loadSettings(): Settings {
  const stored = readStorage<Settings>(STORAGE_KEYS.settings)
  return {
    unit: stored?.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
    theme:
      stored?.theme === 'light' || stored?.theme === 'dark' ? stored.theme : 'system',
  }
}

export default function App() {
  const [preview, setPreview] = useState<PreviewState>('live')
  const [weather, setWeather] = useState<WeatherSnapshot | null>(readCachedWeather)
  const [city, setCity] = useState<City>(
    () => weather?.city ?? readStorage<City>(STORAGE_KEYS.lastCity) ?? DEFAULT_CITY,
  )
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>(
    weather ? 'ready' : 'loading',
  )
  const [weatherError, setWeatherError] = useState('')
  const [favourites, setFavourites] = useState<Favourite[]>(loadFavourites)
  const [storageBlocked, setStorageBlocked] = useState(false)
  const [notice, setNotice] = useState('')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const initialCityRef = useRef(city)
  const hadCacheRef = useRef(Boolean(weather))
  const unit: Unit = settings.unit
  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemDark)

  const loadWeather = useCallback(async (nextCity: City, silent = false) => {
    /* A newer selection wins: cancel the request that is still in flight. */
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setCity(nextCity)
    setNotice('')
    if (!silent) setWeatherStatus('loading')
    setWeatherError('')

    try {
      const snapshot = await getWeather(nextCity, controller.signal)
      if (controller.signal.aborted) return

      setWeather(snapshot)
      setWeatherStatus('ready')
      writeStorage(STORAGE_KEYS.lastCity, nextCity)
    } catch (error) {
      if (isCanceled(error) || controller.signal.aborted) return

      if (silent) {
        setNotice(MESSAGES.refreshFailed)
        return
      }

      setWeatherError((error as ApiError).message || MESSAGES.network)
      setWeatherStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!navigator.onLine) return

    const controller = new AbortController()
    requestRef.current = controller

    async function loadInitialWeather() {
      try {
        const snapshot = await getWeather(initialCityRef.current, controller.signal)
        if (controller.signal.aborted) return

        setWeather(snapshot)
        setWeatherStatus('ready')
        writeStorage(STORAGE_KEYS.lastCity, initialCityRef.current)
      } catch (error) {
        if (isCanceled(error) || controller.signal.aborted) return

        if (hadCacheRef.current) {
          setNotice(MESSAGES.refreshFailed)
          return
        }

        setWeatherError((error as ApiError).message || MESSAGES.network)
        setWeatherStatus('error')
      }
    }

    void loadInitialWeather()
    return () => controller.abort()
  }, [])

  /* Real connection changes: refresh quietly when back online, keep cache offline. */
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      void loadWeather(city, Boolean(weather))
    }

    function handleOffline() {
      setIsOnline(false)
      requestRef.current?.abort()
      if (weather) setWeatherStatus('ready')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [city, weather, loadWeather])

  /* Browsers fire this when the app meets the install criteria. */
  useEffect(() => {
    function handlePrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  /* The class drives every `dark:` style; `system` follows the OS setting. */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#0b1219' : '#eef2f6')
  }, [isDark])

  const isLoading = preview === 'loading' || (preview !== 'error' && weatherStatus === 'loading')
  const isError = preview === 'error' || weatherStatus === 'error'
  const isStale = weather?.isStale ?? false
  const offlineEmpty = !isOnline && !weather && preview !== 'loading' && preview !== 'error'
  const isFavourite = weather
    ? favourites.some((item) => isSameCity(item.city, weather.city))
    : false

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    writeStorage(STORAGE_KEYS.settings, next)
  }

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    setInstallPrompt(null)
  }

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
                  onClick={() => updateSettings({ unit: 'celsius' })}
                  aria-pressed={unit === 'celsius'}
                  className={cn(
                    'min-h-11 min-w-11 rounded-md px-3 text-xs font-semibold transition-colors',
                    unit === 'celsius' ? 'bg-ink text-page' : 'text-muted hover:text-ink',
                  )}
                >
                  {UNIT_LABELS.celsius}
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ unit: 'fahrenheit' })}
                  aria-pressed={unit === 'fahrenheit'}
                  className={cn(
                    'min-h-11 min-w-11 rounded-md px-3 text-xs font-semibold transition-colors',
                    unit === 'fahrenheit' ? 'bg-ink text-page' : 'text-muted hover:text-ink',
                  )}
                >
                  {UNIT_LABELS.fahrenheit}
                </button>
              </div>

              <button
                type="button"
                onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="grid size-11 place-items-center rounded-lg border border-line bg-card text-ink shadow-card transition-colors hover:bg-panel"
              >
                {isDark ? (
                  <Sun size={18} aria-hidden="true" />
                ) : (
                  <Moon size={18} aria-hidden="true" />
                )}
              </button>

              {installPrompt && (
                <button
                  type="button"
                  onClick={() => void installApp()}
                  aria-label="Install WeatherBoard"
                  title="Install WeatherBoard"
                  className="grid size-11 place-items-center rounded-lg border border-line bg-card text-ink shadow-card transition-colors hover:bg-panel"
                >
                  <Download size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </header>

          <div className="mx-auto mt-8 w-full max-w-[1480px] lg:mt-12">
            {notice && (
              <div className="mb-5">
                <NoticeBanner message={notice} />
              </div>
            )}

            {weather && (preview === 'offline' || !isOnline) && (
              <div className="mb-5">
                <OfflineBanner updatedAt={weather.current.updatedAt} isStale={isStale} />
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
              <FetchError message={MESSAGES.network} onRetry={retryWeather} />
            ) : offlineEmpty ? (
              <OfflineEmpty />
            ) : isLoading ? (
              <WeatherSkeleton />
            ) : isError ? (
              <FetchError message={weatherError} onRetry={retryWeather} />
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
