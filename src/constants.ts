/**
 * Single source of truth for shared values.
 * Screens and services import from here instead of hardcoding strings,
 * URLs, limits or storage keys in more than one place.
 */

export const APP_NAME = 'WeatherBoard'

export const DEFAULT_CITY = {
  name: 'Karachi',
  country: 'Pakistan',
  countryCode: 'PK',
  lat: 24.8607,
  lon: 67.0011,
} as const

export const MAX_FAVOURITES = 5
export const SEARCH_DEBOUNCE_MS = 300
export const MAX_SUGGESTIONS = 6
export const CACHE_TTL_MS = 30 * 60 * 1000

export const STORAGE_KEYS = {
  favourites: 'weatherboard:favourites',
  settings: 'weatherboard:settings',
  lastCity: 'weatherboard:last-city',
  cachedWeather: 'weatherboard:cached-weather',
  reminder: 'weatherboard:reminder',
} as const

/* Keys are optional: when absent the app falls back to keyless Open-Meteo. */
export const API = {
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    key: import.meta.env.VITE_OPENWEATHER_KEY ?? '',
  },
  openMeteo: {
    forecastUrl: 'https://api.open-meteo.com/v1/forecast',
    geocodeUrl: 'https://geocoding-api.open-meteo.com/v1/search',
  },
  geoDb: {
    baseUrl: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
    host: 'wft-geo-db.p.rapidapi.com',
    key: import.meta.env.VITE_GEODB_KEY ?? '',
  },
} as const

export const DEFAULT_SETTINGS = {
  unit: 'celsius',
  theme: 'system',
} as const

export const DEFAULT_REMINDER = {
  enabled: false,
  time: '07:30',
} as const

export const UNIT_LABELS = {
  celsius: '°C',
  fahrenheit: '°F',
} as const

export const PREVIEW_STATES = [
  { id: 'offline', label: 'Offline' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Fetch error' },
  { id: 'blocked', label: 'Blocked notifications' },
] as const

/*
 * Normalised condition keys shared by both weather providers.
 * `label` feeds the UI; `icon` picks the drawing in the condition icon component.
 */
export const CONDITIONS = {
  clear: { label: 'Sunny', icon: 'sun' },
  partly: { label: 'Partly cloudy', icon: 'partly' },
  cloudy: { label: 'Overcast', icon: 'cloud' },
  rain: { label: 'Light rain', icon: 'rain' },
  storm: { label: 'Thunderstorm', icon: 'storm' },
  snow: { label: 'Snow', icon: 'snow' },
  fog: { label: 'Fog', icon: 'fog' },
} as const

export const MESSAGES = {
  emptyCity: 'Enter a city name to see the weather.',
  selectCity: 'Pick a city from the suggestions so we know which one you mean.',
  noResults: 'No cities matched that name. Check the spelling or try a nearby city.',
  network: 'We could not reach the weather service. Check your connection and try again.',
  rateLimit: 'The weather service is busy right now. Try again in a minute.',
  server: 'The weather service returned an error. Please try again shortly.',
  offlineNoCache: 'You are offline and no weather has been saved yet. Reconnect and search for a city.',
  favouritesFull: `You can save up to ${MAX_FAVOURITES} cities. Remove one first.`,
  storageBlocked: 'Your browser is blocking local storage, so changes will only last for this session.',
  notificationsUnsupported: 'This browser does not support notifications, so the daily reminder is unavailable.',
  notificationsBlocked: 'Notifications are blocked in your browser settings. Allow them for this site to use reminders.',
} as const
