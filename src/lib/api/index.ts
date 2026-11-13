import { API, CACHE_TTL_MS, MAX_SUGGESTIONS, MESSAGES, STORAGE_KEYS } from '../constants'
import { geoClient, weatherClient } from './client'
import type {
  ApiError,
  City,
  CurrentWeather,
  ForecastDay,
  WeatherSnapshot,
} from '../types'
import { readStorage, writeStorage } from '../utils'

/*
 * Real weather + city data.
 * OpenWeatherMap and GeoDB are used when keys exist; otherwise the same
 * functions fall back to the keyless Open-Meteo APIs. Components only ever
 * see the internal shapes from types.ts.
 */

export function isCanceled(error: unknown) {
  return typeof error === 'object' && error !== null && (error as ApiError).kind === 'canceled'
}

/* ---------- City search ---------- */

interface GeoDbCity {
  id: number
  name: string
  country?: string
  countryCode?: string
  latitude: number
  longitude: number
}

interface GeoDbResponse {
  data?: GeoDbCity[]
}

interface OpenMeteoGeoCity {
  id: number
  name: string
  country?: string
  country_code?: string
  latitude: number
  longitude: number
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoCity[]
}

async function searchGeoDb(query: string, signal?: AbortSignal): Promise<City[]> {
  const response = await geoClient.get<GeoDbResponse>('/cities', {
    params: {
      namePrefix: query,
      limit: MAX_SUGGESTIONS,
      sort: '-population',
      types: 'CITY',
    },
    signal,
  })

  return (response.data.data ?? []).map((city) => ({
    id: String(city.id),
    name: city.name,
    country: city.country ?? '',
    countryCode: city.countryCode,
    lat: city.latitude,
    lon: city.longitude,
  }))
}

async function searchOpenMeteo(query: string, signal?: AbortSignal): Promise<City[]> {
  const response = await weatherClient.get<OpenMeteoGeoResponse>(API.openMeteo.geocodeUrl, {
    params: { name: query, count: MAX_SUGGESTIONS, language: 'en', format: 'json' },
    signal,
  })

  return (response.data.results ?? []).map((city) => ({
    id: String(city.id),
    name: city.name,
    country: city.country ?? '',
    countryCode: city.country_code,
    lat: city.latitude,
    lon: city.longitude,
  }))
}

/**
 * Query both providers in parallel. Open-Meteo leads because it covers cities
 * missing from GeoDB's free dataset, while GeoDB adds its population-ranked
 * results and still powers the "keyed autocomplete" integration.
 */
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const requests: Array<Promise<City[]>> = [searchOpenMeteo(term, signal)]
  if (API.geoDb.key) requests.push(searchGeoDb(term, signal))

  const settled = await Promise.allSettled(requests)
  const canceled = settled.find(
    (result) => result.status === 'rejected' && isCanceled(result.reason),
  )
  if (canceled && canceled.status === 'rejected') throw canceled.reason

  const cities = settled.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  )

  if (cities.length === 0) {
    const failure = settled.find((result) => result.status === 'rejected')
    if (failure && failure.status === 'rejected') throw failure.reason
    return []
  }

  /* Remove the same place when both providers return it. */
  const seen = new Set<string>()
  return cities
    .filter((city) => {
      const key = `${city.name.toLowerCase()}|${(city.countryCode ?? city.country).toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, MAX_SUGGESTIONS)
}

/* ---------- Weather ---------- */

interface OwmCurrentResponse {
  main: {
    temp: number
    feels_like: number
    humidity: number
    temp_min: number
    temp_max: number
  }
  wind: { speed: number }
  weather: Array<{ id: number }>
}

interface OwmForecastItem {
  dt_txt: string
  main: { temp_min: number; temp_max: number }
  weather: Array<{ id: number }>
}

interface OwmForecastResponse {
  list: OwmForecastItem[]
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
  }
  daily?: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

function conditionFromOwm(code: number) {
  if (code >= 200 && code < 300) return 'storm'
  if (code >= 300 && code < 600) return 'rain'
  if (code >= 600 && code < 700) return 'snow'
  if (code >= 700 && code < 800) return 'fog'
  if (code === 800) return 'clear'
  if (code < 804) return 'partly'
  return 'cloudy'
}

function conditionFromWmo(code: number) {
  if (code === 0) return 'clear'
  if (code <= 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloudy'
}

function hourOf(forecast: OwmForecastItem) {
  return Number(forecast.dt_txt.slice(11, 13))
}

async function fetchOpenWeather(city: City, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = {
    lat: city.lat,
    lon: city.lon,
    units: 'metric',
    appid: API.openWeather.key,
  }

  const [currentResponse, forecastResponse] = await Promise.all([
    weatherClient.get<OwmCurrentResponse>(`${API.openWeather.baseUrl}/weather`, { params, signal }),
    weatherClient.get<OwmForecastResponse>(`${API.openWeather.baseUrl}/forecast`, {
      params,
      signal,
    }),
  ])

  const current = currentResponse.data
  const currentCondition = conditionFromOwm(current.weather[0]?.id ?? 800)

  /* The 3-hourly list is grouped per day; midday drives that day's icon. */
  const days = new Map<string, { min: number; max: number; sample: OwmForecastItem }>()
  for (const item of forecastResponse.data.list) {
    const date = item.dt_txt.slice(0, 10)
    const day = days.get(date)

    if (!day) {
      days.set(date, { min: item.main.temp_min, max: item.main.temp_max, sample: item })
      continue
    }

    day.min = Math.min(day.min, item.main.temp_min)
    day.max = Math.max(day.max, item.main.temp_max)
    if (Math.abs(hourOf(item) - 12) < Math.abs(hourOf(day.sample) - 12)) {
      day.sample = item
    }
  }

  const forecast: ForecastDay[] = [...days.entries()].slice(0, 5).map(([date, day]) => {
    const condition = conditionFromOwm(day.sample.weather[0]?.id ?? 800)
    return {
      date,
      condition,
      icon: condition,
      minC: day.min,
      maxC: day.max,
    }
  })

  return {
    city,
    current: {
      tempC: current.main.temp,
      feelsLikeC: current.main.feels_like,
      humidity: current.main.humidity,
      windKph: current.wind.speed * 3.6,
      condition: currentCondition,
      icon: currentCondition,
      highC: current.main.temp_max,
      lowC: current.main.temp_min,
      updatedAt: Date.now(),
    },
    forecast,
  }
}

async function fetchOpenMeteo(city: City, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const response = await weatherClient.get<OpenMeteoWeatherResponse>(
    API.openMeteo.forecastUrl,
    {
      params: {
        latitude: city.lat,
        longitude: city.lon,
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: 5,
        wind_speed_unit: 'kmh',
      },
      signal,
    },
  )

  const { current, daily } = response.data
  if (!current || !daily) {
    throw { message: MESSAGES.server, kind: 'server' } satisfies ApiError
  }

  const currentCondition = conditionFromWmo(current.weather_code)
  const forecast: ForecastDay[] = daily.time.slice(0, 5).map((date, index) => {
    const condition = conditionFromWmo(daily.weather_code[index] ?? 0)
    return {
      date,
      condition,
      icon: condition,
      minC: daily.temperature_2m_min[index],
      maxC: daily.temperature_2m_max[index],
    }
  })

  const currentWeather: CurrentWeather = {
    tempC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windKph: current.wind_speed_10m,
    condition: currentCondition,
    icon: currentCondition,
    highC: daily.temperature_2m_max[0] ?? current.temperature_2m,
    lowC: daily.temperature_2m_min[0] ?? current.temperature_2m,
    updatedAt: Date.now(),
  }

  return { city, current: currentWeather, forecast }
}

function cacheWeather(snapshot: WeatherSnapshot) {
  writeStorage(STORAGE_KEYS.cachedWeather, snapshot)
}

/** Used by the offline mode step; safe to call before any weather exists. */
export function readCachedWeather(): WeatherSnapshot | null {
  const cached = readStorage<WeatherSnapshot>(STORAGE_KEYS.cachedWeather)
  if (!cached) return null

  return {
    ...cached,
    isStale: Date.now() - cached.current.updatedAt > CACHE_TTL_MS,
  }
}

/**
 * Try the keyed provider first, then the keyless one. The first provider's
 * error is kept so the user sees the most relevant message if both fail.
 */
export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherSnapshot> {
  let providerError: ApiError | null = null

  if (API.openWeather.key) {
    try {
      const snapshot = await fetchOpenWeather(city, signal)
      cacheWeather(snapshot)
      return snapshot
    } catch (error) {
      if (isCanceled(error)) throw error
      providerError = error as ApiError
    }
  }

  try {
    const snapshot = await fetchOpenMeteo(city, signal)
    cacheWeather(snapshot)
    return snapshot
  } catch (error) {
    if (isCanceled(error)) throw error
    throw providerError ?? error
  }
}
