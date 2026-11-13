export type Unit = 'celsius' | 'fahrenheit'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface City {
  id?: string
  name: string
  country: string
  countryCode?: string
  lat: number
  lon: number
}

export interface CurrentWeather {
  tempC: number
  feelsLikeC: number
  humidity: number
  windKph: number
  condition: string
  icon: string
  highC: number
  lowC: number
  updatedAt: number
}

export interface ForecastDay {
  date: string
  condition: string
  icon: string
  minC: number
  maxC: number
}

export interface WeatherSnapshot {
  city: City
  current: CurrentWeather
  forecast: ForecastDay[]
  /** Set only when a cached copy is older than the cache TTL. */
  isStale?: boolean
}

export interface Settings {
  unit: Unit
  theme: ThemeMode
}

export interface Reminder {
  enabled: boolean
  time: string
}

export interface Favourite {
  city: City
  addedAt: number
}

/** `live` is the normal app; the others are forced by the preview bar. */
export type PreviewState = 'live' | 'loading' | 'error' | 'offline' | 'blocked'

export interface ApiError {
  message: string
  kind: 'network' | 'not-found' | 'rate-limit' | 'server' | 'canceled' | 'unknown'
}
